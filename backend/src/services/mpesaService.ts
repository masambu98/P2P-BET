import axios from 'axios';
import { PrismaClient, Prisma } from '@prisma/client';
import { 
  getMpesaConfig, 
  getMpesaBaseUrl, 
  generateMpesaPassword, 
  generateMpesaTimestamp,
  MpesaStkPushRequest,
  MpesaStkPushResponse,
  MpesaCallbackData,
  validateMpesaPhone,
  formatMpesaPhone
} from '../config/mpesa';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

class MpesaService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    
    if (this.accessToken && this.tokenExpiry > now) {
      return this.accessToken;
    }

    const config = getMpesaConfig();
    const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
    
    try {
      const response = await axios.post(
        `${getMpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
        {},
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = now + (response.data.expires_in * 1000) - 60000; // Refresh 1 minute before expiry
      
      logger.info('M-Pesa access token generated successfully');
      return this.accessToken;
    } catch (error: any) {
      logger.error('Failed to generate M-Pesa access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with M-Pesa');
    }
  }

  async initiateStkPush(request: MpesaStkPushRequest): Promise<MpesaStkPushResponse> {
    const config = getMpesaConfig();
    const accessToken = await this.getAccessToken();
    const timestamp = generateMpesaTimestamp();
    const password = generateMpesaPassword();

    // Validate phone number
    if (!validateMpesaPhone(request.phoneNumber)) {
      throw new Error('Invalid Kenyan phone number format');
    }

    const formattedPhone = formatMpesaPhone(request.phoneNumber);

    const stkPushRequest = {
      BusinessShortCode: config.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: request.amount,
      PartyA: formattedPhone,
      PartyB: config.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: request.callbackUrl || config.callbackUrl,
      AccountReference: request.accountReference,
      TransactionDesc: request.transactionDesc,
    };

    try {
      const response = await axios.post<MpesaStkPushResponse>(
        `${getMpesaBaseUrl()}/mpesa/stkpush/v1/processrequest`,
        stkPushRequest,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('M-Pesa STK Push initiated:', {
        phoneNumber: formattedPhone,
        amount: request.amount,
        checkoutRequestID: response.data.CheckoutRequestID
      });

      return response.data;
    } catch (error: any) {
      logger.error('M-Pesa STK Push failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment');
    }
  }

  async processCallback(callbackData: MpesaCallbackData): Promise<void> {
    try {
      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;

      logger.info('M-Pesa callback received:', {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc
      });

      // Find the pending transaction
      const transaction = await prisma.transaction.findFirst({
        where: {
          reference: CheckoutRequestID,
          status: 'PENDING',
          type: 'DEPOSIT'
        },
        include: {
          user: true,
          wallet: true
        }
      });

      if (!transaction) {
        logger.warn('No pending transaction found for callback:', { CheckoutRequestID });
        return;
      }

      if (ResultCode === 0) {
        // Successful payment
        let amount = transaction.amount;
        let mpesaReceipt = '';

        // Extract amount and receipt from metadata
        if (CallbackMetadata?.Item) {
          const amountItem = CallbackMetadata.Item.find(item => item.Name === 'Amount');
          const receiptItem = CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber');
          
          if (amountItem) {
            amount = new Prisma.Decimal(parseFloat(amountItem.Value));
          }
          if (receiptItem) {
            mpesaReceipt = receiptItem.Value;
          }
        }

        // Update wallet balance
        await prisma.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: {
              increment: amount
            }
          }
        });

        // Update transaction
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            amount: amount,
            metadata: {
              ...(transaction.metadata as any ?? {}),
              mpesaReceipt,
              callbackData
            }
          }
        });

        // Create deposit request record
        await prisma.depositRequest.create({
          data: {
            userId: transaction.userId,
            amount: amount,
            method: 'mpesa',
            reference: mpesaReceipt,
            status: 'APPROVED',
            processedAt: new Date(),
            metadata: {
              merchantRequestID: MerchantRequestID,
              checkoutRequestID: CheckoutRequestID,
              phoneNumber: CallbackMetadata?.Item?.find(item => item.Name === 'PhoneNumber')?.Value
            }
          }
        });

        logger.info('M-Pesa payment processed successfully:', {
          transactionId: transaction.id,
          userId: transaction.userId,
          amount,
          mpesaReceipt
        });
      } else {
        // Failed payment
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            metadata: {
              ...(transaction.metadata as any ?? {}),
              callbackData,
              failureReason: ResultDesc
            }
          }
        });

        logger.warn('M-Pesa payment failed:', {
          transactionId: transaction.id,
          userId: transaction.userId,
          ResultCode,
          ResultDesc
        });
      }
    } catch (error: any) {
      logger.error('Error processing M-Pesa callback:', error);
      throw error;
    }
  }

  async queryTransactionStatus(checkoutRequestID: string): Promise<any> {
    const config = getMpesaConfig();
    const accessToken = await this.getAccessToken();
    const timestamp = generateMpesaTimestamp();
    const password = generateMpesaPassword();

    const queryRequest = {
      BusinessShortCode: config.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID,
    };

    try {
      const response = await axios.post(
        `${getMpesaBaseUrl()}/mpesa/stkpushquery/v1/query`,
        queryRequest,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('M-Pesa transaction query failed:', error.response?.data || error.message);
      throw new Error('Failed to query M-Pesa transaction status');
    }
  }

  async reverseTransaction(transactionID: string, remarks: string): Promise<void> {
    const config = getMpesaConfig();
    const accessToken = await this.getAccessToken();
    const timestamp = generateMpesaTimestamp();
    const password = generateMpesaPassword();

    const reversalRequest = {
      TransactionType: 'TransactionReversal',
      TransID: transactionID,
      Amount: 0, // Will be determined by M-Pesa
      ReceiverParty: config.shortcode,
      Initiator: config.initiatorName,
      SecurityCredential: config.initiatorPassword,
      CommandID: 'TransactionReversal',
      SenderIdentifierType: '4',
      RecieverIdentifierType: '4',
      ResultURL: config.callbackUrl,
      QueueTimeOutURL: config.callbackUrl,
      Remarks: remarks,
      Occasion: 'Reversal'
    };

    try {
      await axios.post(
        `${getMpesaBaseUrl()}/mpesa/reversal/v1/request`,
        reversalRequest,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('M-Pesa reversal initiated:', { transactionID, remarks });
    } catch (error: any) {
      logger.error('M-Pesa reversal failed:', error.response?.data || error.message);
      throw new Error('Failed to reverse M-Pesa transaction');
    }
  }
}

export const mpesaService = new MpesaService();
