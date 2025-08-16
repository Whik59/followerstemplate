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

// Interface for individual cart items (can be shared across abandoned cart emails)
interface CartItem {
  productName: string;
  productImage?: string; 
  quantity: number;
  price: number; 
  productUrl?: string; 
}

interface AbandonedCartEmail2Props {
  // customerFirstName?: string; // REMOVED
  returnToCartUrl: string; 
  siteName: string;
  siteBaseUrl: string;
  locale: string;
  t: TranslatorFunction;
  couponCode: string; // More generic, actual code passed from route
  discountPercentage: number;
  couponValidityHours: number;
  unsubscribeUrl: string; // Added unsubscribeUrl prop
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

const button = {
  backgroundColor: '#28a745', // A positive green for discount claim
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
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
  backgroundColor: '#e0f2f7', // A slightly different, inviting blue/teal
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #b2dfdb',
  marginTop: '20px',
  textAlign: 'center' as const,
};

const discountText = {
  ...paragraph,
  color: '#00796b', // Darker teal for text
  fontSize: '18px',
  margin: '0 0 10px 0',
  fontWeight: 'bold' as const,
};

const couponCodeText = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#004d40', // Even darker teal for the code itself
  border: '2px dashed #00796b',
  padding: '5px 10px',
  borderRadius: '5px',
  display: 'inline-block', // To allow padding and border properly
  margin: '10px 0',
};

const validityText = { // Renamed from urgencyText for clarity
  ...paragraph,
  color: '#c2185b', // A distinct pink/magenta for the validity period
  fontWeight: 'bold' as const,
  fontSize: '15px',
  marginTop: '10px',
  textAlign: 'center' as const,
};

const footer = {
  backgroundColor: '#f6f9fc',
  padding: '20px',
  borderRadius: '5px',
  marginTop: '20px',
};

const footerLink = {
  color: '#8898aa',
  fontSize: '12px',
  textDecoration: 'underline',
};

export function AbandonedCartEmail2({
  // customerFirstName, // REMOVED
  returnToCartUrl,
  siteName,
  siteBaseUrl,
  locale,
  t,
  couponCode,
  discountPercentage,
  couponValidityHours,
  unsubscribeUrl,
}: AbandonedCartEmail2Props) {
  const previewText = t('abandonedCart2PreviewDiscountUrgency', { discountPercentage, defaultValue: `Your ${discountPercentage}% discount is waiting! Claim it now.` });

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={{ ...paragraph, fontSize: '26px', textAlign: 'center', color: '#007bff' }}>
              {t('abandonedCart2MainHeadingDiscountUrgency', { defaultValue: "Don't Miss Out on Your Savings!" })}
            </Heading>
            <Text style={paragraph}>
              {t('abandonedCart2GreetingGeneric', { defaultValue: "Hello again," })}
            </Text>
            <Text style={paragraph}>
              {t('abandonedCart2BodyDiscountUrgency', { siteName, discountPercentage, defaultValue: `We saw you were checking out some great items at ${siteName}. To welcome you (back), we're offering you an exclusive ${discountPercentage}% discount on your entire order!` })}
            </Text>
            
            <Section style={discountSection}>
              <Text style={discountText}>
                {t('abandonedCart2OfferIntroDiscount', { discountPercentage, defaultValue: `Here's Your ${discountPercentage}% Discount Code:` })}
              </Text>
              <Text>
                <strong style={couponCodeText}>{couponCode}</strong>
              </Text>
              <Text style={validityText}>
                 {t('abandonedCart2OfferValidityDetailed', { couponValidityHours, defaultValue: `Use this code at checkout within the next ${couponValidityHours} hours to claim your savings.` })}
              </Text>
            </Section>

            <Link href={returnToCartUrl} style={button}>
              {t('abandonedCart2ReturnToCartButtonDiscount', { discountPercentage, defaultValue: `Claim ${discountPercentage}% Off & Shop Now` })}
            </Link>

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

export default AbandonedCartEmail2; 