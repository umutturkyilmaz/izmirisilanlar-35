import Iyzipay from 'iyzipay';

/**
 * iyzico — gizli anahtarlar SADECE sunucu env’de.
 * IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL, IYZICO_ENABLED
 */

export function isIyzicoReady() {
  return (
    process.env.IYZICO_ENABLED === 'true' &&
    Boolean(process.env.IYZICO_API_KEY) &&
    Boolean(process.env.IYZICO_SECRET_KEY)
  );
}

function client() {
  const uri =
    process.env.IYZICO_BASE_URL ||
    (process.env.IYZICO_SANDBOX === 'false'
      ? 'https://api.iyzipay.com'
      : 'https://sandbox-api.iyzipay.com');
  return new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri,
  });
}

function money(n) {
  return Number(n).toFixed(2);
}

/**
 * Checkout Form Initialize
 * @returns {Promise<{ token: string, paymentPageUrl: string, status: string, raw: object }>}
 */
export function initializeCheckoutForm(input) {
  return new Promise((resolve, reject) => {
    if (!isIyzicoReady()) {
      reject(new Error('iyzico yapılandırılmamış'));
      return;
    }
    const price = money(input.price);
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: input.conversationId,
      price,
      paidPrice: price,
      currency: Iyzipay.CURRENCY.TRY,
      basketId: input.basketId || input.conversationId,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: input.callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: input.buyer.id,
        name: input.buyer.name,
        surname: input.buyer.surname || 'N/A',
        gsmNumber: input.buyer.gsmNumber || '+905350000000',
        email: input.buyer.email,
        identityNumber: input.buyer.identityNumber || '11111111111',
        registrationAddress: input.buyer.address || 'Türkiye',
        ip: input.buyer.ip || '85.34.78.112',
        city: input.buyer.city || 'Izmir',
        country: 'Turkey',
      },
      shippingAddress: {
        contactName: input.buyer.name,
        city: input.buyer.city || 'Izmir',
        country: 'Turkey',
        address: input.buyer.address || 'Türkiye',
      },
      billingAddress: {
        contactName: input.buyer.name,
        city: input.buyer.city || 'Izmir',
        country: 'Turkey',
        address: input.buyer.address || 'Türkiye',
      },
      basketItems: [
        {
          id: input.packageId,
          name: input.packageName,
          category1: 'Job Listing',
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price,
        },
      ],
    };

    client().checkoutFormInitialize.create(request, (err, result) => {
      if (err) return reject(err);
      if (result.status !== 'success') {
        const code = result.errorCode ? ` [kod ${result.errorCode}]` : '';
        return reject(new Error(`${result.errorMessage || 'iyzico initialize başarısız'}${code}`));
      }
      resolve({
        token: result.token,
        paymentPageUrl: result.paymentPageUrl,
        status: result.status,
        raw: result,
      });
    });
  });
}

function callIyzico(resource, request) {
  return new Promise((resolve, reject) => {
    if (!isIyzicoReady()) {
      reject(new Error('iyzico yapılandırılmamış'));
      return;
    }
    client()[resource].create(request, (err, result) => {
      if (err) return reject(err);
      if (result.status !== 'success') {
        const code = result.errorCode ? ` [kod ${result.errorCode}]` : '';
        return reject(new Error(`${result.errorMessage || `iyzico ${resource} başarısız`}${code}`));
      }
      resolve(result);
    });
  });
}

/** Aynı gün (gün sonu öncesi) tam iptal */
export function cancelPayment(paymentId, ip) {
  return callIyzico('cancel', { locale: Iyzipay.LOCALE.TR, paymentId: String(paymentId), ip });
}

/** Gün sonu sonrası tam iade (v2: paymentId + tutar) */
export function refundPayment(paymentId, price, ip) {
  return callIyzico('refundV2', {
    locale: Iyzipay.LOCALE.TR,
    paymentId: String(paymentId),
    price: money(price),
    currency: Iyzipay.CURRENCY.TRY,
    ip,
  });
}

/** Checkout Form sonucu (callback token ile) */
export function retrieveCheckoutForm(token, conversationId) {
  return new Promise((resolve, reject) => {
    if (!isIyzicoReady()) {
      reject(new Error('iyzico yapılandırılmamış'));
      return;
    }
    const request = { locale: Iyzipay.LOCALE.TR, token };
    if (conversationId) request.conversationId = conversationId;
    client().checkoutForm.retrieve(request, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}
