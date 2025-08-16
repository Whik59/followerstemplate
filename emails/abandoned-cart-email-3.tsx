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
  productImage?: string; 
  quantity: number;
  price: number; 
  productUrl?: string; 
}

// Interface for a testimonial/social proof item
interface Testimonial {
  quote: string;
  author: string;
  rating?: number; // Optional star rating (e.g., 1-5)
}

interface AbandonedCartEmail3Props {
  // customerFirstName?: string; // REMOVED
  returnToCartUrl: string; 
  siteName: string;
  siteBaseUrl: string;
  locale: string;
  t: TranslatorFunction;
  couponCode: string; 
  discountPercentage: number;
  couponValidityHours?: number;
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
  color: '#007bff',
  textDecoration: 'underline',
};

// Button style to be more urgent for a better discount
const button = {
  backgroundColor: '#ff8c00', // A strong orange for urgency and value
  borderRadius: '5px',
  color: '#ffffff',
  fontSize: '17px', // Slightly larger
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '13px',
  marginTop: '25px',
};

const itemImage = {
  maxWidth: '100px',
  maxHeight: '100px',
  objectFit: 'cover' as const,
  borderRadius: '4px',
  border: '1px solid #eaeaea',
  marginRight: '15px',
};

const discountSection = {
  backgroundColor: '#fff8e1', // Lighter, more premium gold/yellow
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #ffecb3',
  marginTop: '20px',
  textAlign: 'center' as const,
};

const discountText = {
  ...paragraph,
  color: '#e65100', // Darker orange for emphasis
  fontSize: '19px',
  fontWeight: 'bold' as const,
  margin: '0 0 10px 0',
};

const couponCodeText = {
  fontSize: '24px', // Larger coupon code
  fontWeight: 'bold' as const,
  color: '#bf360c', // Deep orange/red for the code
  border: '2px dashed #ff8c00',
  padding: '6px 12px',
  borderRadius: '5px',
  display: 'inline-block',
  margin: '10px 0',
};

const validityText = { 
  ...paragraph,
  color: '#d32f2f', // Stronger red for validity
  fontWeight: 'bold' as const,
  fontSize: '16px',
  marginTop: '10px',
  textAlign: 'center' as const,
};

const scarcityWarningText = { // New style for prominent scarcity message
  ...paragraph,
  backgroundColor: '#ffebee', // Very light red background
  color: '#c62828', // Strong red text
  fontWeight: 'bold',
  fontSize: '16px',
  textAlign: 'center' as const,
  padding: '10px',
  borderRadius: '5px',
  border: '1px solid #ef9a9a',
  marginTop: '20px',
};

const scarcityText = { 
  ...paragraph,
  color: '#dc3545',
  fontWeight: 'bold'  as const,
  fontSize: '15px',
  textAlign: 'center' as const,
  marginTop: '15px',
};

const urgencyText = {
  ...paragraph,
  color: '#856404',
  fontWeight: 'bold' as const,
  fontSize: '14px',
};

const limitedStockText = { 
  ...paragraph,
  color: '#dc3545',
  fontWeight: 'bold' as const,
  fontSize: '14px',
  textAlign: 'center' as const,
  marginTop: '10px',
};

// Remove testimonial-specific styles if they are no longer used anywhere else
// const testimonialSection = { ... };
// const testimonialCard = { ... };
// const testimonialText = { ... };
// const testimonialAuthor = { ... };

const footer = {
  backgroundColor: '#f6f9fc',
  padding: '20px',
  borderTop: '1px solid #e6ebf1',
};

const footerLink = {
  color: '#8898aa',
  fontSize: '12px',
  textDecoration: 'underline',
};

export function AbandonedCartEmail3({
  // customerFirstName, // REMOVED
  returnToCartUrl,
  siteName,
  siteBaseUrl,
  locale,
  t,
  couponCode,
  discountPercentage,
  couponValidityHours = 48,
  unsubscribeUrl,
}: AbandonedCartEmail3Props) {
  const previewText = t('abandonedCart3PreviewIncreasedDiscountScarcity', { discountPercentage, defaultValue: `Act Fast! ${discountPercentage}% OFF + items selling out!` });

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={{ ...paragraph, fontSize: '28px', textAlign: 'center', color: '#ff8c00' }}>
              {t('abandonedCart3MainHeadingIncreasedDiscountScarcity', { defaultValue: "Your Items Are In High Demand!" })}
            </Heading>
            <Text style={paragraph}>
              {t('abandonedCart3GreetingGeneric', { defaultValue: "Hello again," })}
            </Text>
            <Text style={paragraph}>
              {t('abandonedCart3BodyIncreasedDiscountScarcity', { siteName, discountPercentage, defaultValue: `We've noticed the items you liked at ${siteName} are very popular! To make sure you don't miss out, and as a special thank you, here's an even better discount: ${discountPercentage}% OFF your entire order.` })}
            </Text>
            
            <Section style={discountSection}>
              <Text style={discountText}>
                {t('abandonedCart3OfferIntroIncreasedDiscount', { discountPercentage, defaultValue: `Get ${discountPercentage}% OFF With Code:` })}
              </Text>
              <Text>
                <strong style={couponCodeText}>{couponCode}</strong>
              </Text>
              <Text style={validityText}>
                {t('abandonedCart3OfferValidityIncreasedDiscount', { couponValidityHours, defaultValue: `This special offer is only valid for the next ${couponValidityHours} hours. Grab it now!` })}
              </Text>
            </Section>

            <Text style={scarcityWarningText}>
              {t('abandonedCart3StockScarcityWarning', { defaultValue: "🔥 Heads up! Stock is running low for some of your selected items due to high demand. Order soon to avoid disappointment!"})}
            </Text>

            <Link href={returnToCartUrl} style={button}>
              {t('abandonedCart3ReturnToCartButtonIncreasedDiscount', { discountPercentage, defaultValue: `Secure Your Items & ${discountPercentage}% Discount` })}
            </Link>
            
            {/* Testimonial section has been removed */}

            <Hr style={{...hr, marginTop: '30px'}} />
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

export default AbandonedCartEmail3; 