import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

// Define a type for the t function if you pass it from server
type TranslatorFunction = (key: string, values?: Record<string, any>) => string;

// ADDED: Interface for individual ordered items
interface OrderDetailItem {
  nameToDisplay: string; // This will be the short title or fallback
  quantity: string | number;
  price: string | number; // Could be string for display or number for calculation if needed
  // productUrl?: string; // Optional: if you want to link to products
}

// MODIFIED: OrderConfirmationEmailProps to use OrderDetailItem[]
interface OrderConfirmationEmailProps {
  orderId: string;
  timestamp: string; 
  customerEmail: string;
  items: OrderDetailItem[]; // REPLACES productNames, productQuantities, productPrices
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  siteName: string;
  siteBaseUrl: string; 
  locale: string; 
  t: TranslatorFunction; 
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #e6ebf1',
  borderRadius: '5px',
};

const box = {
  padding: '0 48px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
};

const anchor = {
  color: '#ff5a5f',
};

const button = {
  backgroundColor: '#656ee8',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '10px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};

export function OrderConfirmationEmail({
  orderId,
  timestamp,
  customerEmail,
  items, // MODIFIED: Using items array
  totalAmount,
  currency,
  paymentMethod,
  siteName,
  siteBaseUrl,
  locale,
  t,
}: OrderConfirmationEmailProps) {
  const customerFirstName = customerEmail.split('@')[0] || 'there';
  const previewText = t('previewText', { orderId, siteName });
  const formattedTimestamp = new Date(timestamp).toLocaleString(locale, {
    year: 'numeric', month: 'long', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            {/* <Img src={`${siteBaseUrl}/logo.png`} width="49" height="21" alt={siteName} /> */}
            <Heading style={{ ...paragraph, fontSize: '24px', textAlign: 'center' }}>
              {t('mainHeading', { customerEmail })}
            </Heading>

            {/* --- START: 1HOUR Coupon Promotion --- */}
            <Section style={{
              backgroundColor: '#fff3cd', // A light yellow, similar to a warning or highlight
              padding: '20px',
              borderRadius: '5px',
              border: '1px solid #ffeeba', // Border to match background
              marginTop: '20px',
              marginBottom: '20px',
            }}>
              <Heading as="h3" style={{
                ...paragraph,
                textAlign: 'center' as const,
                color: '#856404', // Darker yellow/brown for text
                fontSize: '20px',
                marginBottom: '10px',
              }}>
                {t('specialOfferTitle', { defaultValue: "✨ Exclusive Offer Just For You! ✨" })}
              </Heading>
              <Text style={{
                ...paragraph,
                color: '#856404',
                textAlign: 'center' as const,
                fontSize: '16px',
              }}>
                {t('couponOfferPart1', { defaultValue: "As a thank you for your order, use code" })}{' '}
                <strong style={{ fontSize: '18px' }}>1HOUR</strong>{' '}
                {t('couponOfferPart2', { defaultValue: "to get an exclusive" })}{' '}
                <strong style={{ fontSize: '18px' }}>30% DISCOUNT</strong>{' '}
                {t('couponOfferPart3', { defaultValue: "on your next purchase!" })}
              </Text>
              <Text style={{
                ...paragraph,
                color: '#856404',
                textAlign: 'center' as const,
                fontSize: '14px',
                fontWeight: 'bold',
                marginTop: '5px',
              }}>
                {t('couponOfferUrgency', { defaultValue: "Hurry, this amazing deal is only available for the next 1 HOUR!" })}
              </Text>
              <Section style={{ textAlign: 'center', marginTop: '15px' }}>
                <Link
                  style={{ 
                    ...button,
                    backgroundColor: '#ffc107', // Amber/Yellow button
                    color: '#212529', // Dark text for contrast
                    padding: '12px 20px',
                    display: 'inline-block',
                    width: 'auto'
                  }}
                  href={siteBaseUrl} // Link to the homepage or products page
                >
                  {t('shopNowButton', { defaultValue: "Shop Now & Save!" })}
                </Link>
              </Section>
            </Section>
            {/* --- END: 1HOUR Coupon Promotion --- */}
            <Hr style={hr} />

            <Text style={paragraph}>
              {t('greeting', { customerFirstName })}
            </Text>
            <Text style={paragraph}>
              {t('body', { orderId })}
            </Text>
            <Hr style={hr} />
            <Text style={paragraph}>{t('orderDetailsTitle')}</Text>
            <Text style={{ ...paragraph, fontSize: '14px' }}>
              {t('orderIdLabel')} {orderId}<br />
              {t('orderPlacedLabel')} {formattedTimestamp}<br />
              {t('paymentMethodLabel')} {paymentMethod}
            </Text>
            
            <Hr style={hr} />
            <Heading as="h3" style={{ ...paragraph, fontSize: '18px'}}>{t('itemsOrderedTitle')}</Heading>
            {items.map((item, index) => (
              <Section key={item.nameToDisplay + index} style={{ marginBottom: '10px' }}>
                <Row>
                  <Column>
                    <Text style={{...paragraph, fontWeight: 'bold'}}>{item.nameToDisplay}</Text>
                    <Text style={{ ...paragraph, fontSize: '14px', color: '#777'}}>
                      {t('quantityLabel')} {item.quantity} - 
                      {t('priceLabel')} {item.price} {currency}
                    </Text>
                  </Column>
                </Row>
              </Section>
            ))}

            <Hr style={hr} />
            <Section>
              <Row>
                <Column align="right">
                  <Text style={{ ...paragraph, fontSize: '18px', fontWeight: 'bold' }}>
                    {t('totalLabel')} {totalAmount.toFixed(2)} {currency}
                  </Text>
                </Column>
              </Row>
            </Section>
            
            <Hr style={hr} />

            <Hr style={hr} />
            <Text style={paragraph}>
              {t('questionsVisit')} 
              <Link style={anchor} href={siteBaseUrl}>
                 {siteBaseUrl} 
              </Link>.
            </Text>
            <Text style={paragraph}>{t('closing')}<br />{t('teamSignature', { siteName })}</Text>
          </Section>
        </Container>

        <Section style={{textAlign: 'center', marginTop: '32px', marginBottom: '32px'}}>
            <Text style={footer}>
              © {new Date().getFullYear()} {siteName}. All rights reserved.<br />
              {/* Add your physical address or company info if required */}
              {siteBaseUrl}
            </Text>
        </Section>
      </Body>
    </Html>
  );
}

export default OrderConfirmationEmail; 