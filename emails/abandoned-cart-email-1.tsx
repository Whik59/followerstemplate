import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
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

// Interface for individual cart items
interface CartItem {
  productName: string;
  productImage?: string; // URL to the product image
  quantity: number;
  price: number; // Price per unit
  productUrl?: string; // URL to the product page
}

interface AbandonedCartEmail1Props {
  // customerFirstName?: string; // REMOVED
  returnToCartUrl: string;
  siteName: string;
  siteBaseUrl: string;
  locale: string;
  t: TranslatorFunction;
  customerEmail: string;
  cartItems: Array<{
    productName: string;
    productImage: string;
    quantity: number;
    price: number;
    productUrl: string;
  }>;
  unsubscribeUrl: string;
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
  color: '#007bff', // A standard blue link color
  textDecoration: 'underline',
};

const button = {
  backgroundColor: '#007bff', // A neutral blue, or your primary brand color
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
  marginTop: '20px',
};

const itemImage = {
  maxWidth: '100px',
  maxHeight: '100px',
  objectFit: 'cover' as const,
  borderRadius: '4px',
  border: '1px solid #eaeaea',
  marginRight: '15px',
};

const limitedStockText = {
  ...paragraph,
  color: '#dc3545', // A red color for urgency
  fontWeight: 'bold',
  fontSize: '14px',
  textAlign: 'center' as const,
  marginTop: '10px',
};

const popularItemsText = { // New style for highlighting popular items
  ...paragraph,
  color: '#e67e22', // An attention-grabbing but not alarming color like orange
  fontWeight: 'bold',
  fontSize: '15px',
  textAlign: 'center' as const,
  marginTop: '15px',
};

const footer = {
  backgroundColor: '#f6f9fc',
  padding: '20px 48px',
};

const footerLink = {
  color: '#8898aa',
  fontSize: '12px',
  textDecoration: 'underline',
};

export function AbandonedCartEmail1({
  // customerFirstName, // REMOVED from destructuring
  returnToCartUrl,
  siteName,
  siteBaseUrl,
  locale,
  t,
  customerEmail,
  cartItems,
  unsubscribeUrl,
}: AbandonedCartEmail1Props) {
  const previewText = t('abandonedCart1PreviewScarcity', { defaultValue: "Your selected items are popular! Don't miss out." });

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={{ ...paragraph, fontSize: '24px', textAlign: 'center' }}>
              {t('abandonedCart1MainHeadingScarcity', { defaultValue: "Did You Forget Something?" })}
            </Heading>
            <Text style={paragraph}>
              {t('abandonedCart1GreetingGeneric', { defaultValue: "Hello," })}
            </Text>
            <Text style={paragraph}>
              {t('abandonedCart1BodyScarcity', { siteName, defaultValue: `We noticed you left some items in your cart at ${siteName}. Your selections are saved and waiting for you to complete your order.` })}
            </Text>
            
            <Text style={popularItemsText}>
                {t('abandonedCart1PopularityUrgency', { defaultValue: "Heads up! Some items in your cart are quite popular and could sell out soon."})}
            </Text>
            
            <Link href={returnToCartUrl} style={button}>
              {t('abandonedCart1ReturnToCartButtonNoDiscount', { defaultValue: "View Your Cart & Complete Purchase" })}
            </Link>

            <Hr style={{...hr, marginTop: '30px'}}/>
            <Text style={paragraph}>
              {t('abandonedCartQuestions', { siteName, defaultValue: `If you have any questions or need help, feel free to contact our support team at ${siteName}.` })}
            </Text>
            <Text style={{ ...paragraph, fontSize: '14px', marginTop: '20px' }}>
              {t('abandonedCartClosing', { defaultValue: 'Sincerely,'})}<br />
              {t('abandonedCartTeamSignature', { siteName, defaultValue: `The ${siteName} Team`})}
            </Text>
          </Section>
        </Container>

        <Section style={footer}>
          <Text style={{...paragraph, color: '#8898aa', fontSize: '12px', lineHeight: '16px'}}>
            © {new Date().getFullYear()} {siteName}. {t('abandonedCartAllRightsReserved', {defaultValue: 'All rights reserved.'})}<br />
            <Link href={unsubscribeUrl} style={footerLink}>
              {t('unsubscribeLinkText', {defaultValue: 'Unsubscribe from these emails'})}
            </Link>
          </Text>
        </Section>
      </Body>
    </Html>
  );
}

export default AbandonedCartEmail1; 