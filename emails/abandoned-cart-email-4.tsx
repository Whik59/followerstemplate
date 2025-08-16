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

interface AbandonedCartEmail4Props {
  // customerFirstName?: string; // REMOVED
  returnToCartUrl: string; 
  siteName: string;
  siteBaseUrl: string;
  locale: string;
  t: TranslatorFunction;
  couponCode: string; // Generic coupon code
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

// Button style for maximum urgency and value
const button = {
  backgroundColor: '#d9534f', // A strong, definitive red
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '18px', // Larger and bolder
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '14px',
  marginTop: '25px',
  textTransform: 'uppercase' as const, // Emphasize the call to action
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
  backgroundColor: '#f2dede', // A more alarming light red
  padding: '25px',
  borderRadius: '8px',
  border: '2px solid #ebccd1', // Stronger border
  marginTop: '20px',
  textAlign: 'center' as const,
};

const discountTextHeader = { // For the main offer header
  ...paragraph,
  color: '#a94442', // Darker, more serious red
  fontSize: '22px', 
  fontWeight: 'bold' as const,
  margin: '0 0 10px 0',
  textTransform: 'uppercase' as const,
};

const discountTextDetail = { // For the discount percentage itself
  ...paragraph,
  color: '#a94442',
  fontSize: '20px',
  fontWeight: 'bold' as const,
  margin: '5px 0 15px 0',
};

const couponCodeText = {
  fontSize: '26px', // Very prominent coupon code
  fontWeight: 'bold' as const,
  color: '#843534', // Deep, strong red
  border: '3px dashed #a94442',
  padding: '8px 15px',
  borderRadius: '6px',
  display: 'inline-block',
  margin: '15px 0',
  letterSpacing: '1px',
};

const validityText = { 
  ...paragraph,
  color: '#a94442',
  fontWeight: 'bold' as const,
  fontSize: '17px',
  marginTop: '15px',
  textAlign: 'center' as const,
};

const fomoText = { // For the final FOMO message
  ...paragraph,
  color: '#d9534f',
  fontWeight: 'bold',
  fontSize: '18px',
  textAlign: 'center' as const,
  marginTop: '20px',
  padding: '10px',
  backgroundColor: '#fcf8e3', // A contrasting light yellow to make it pop
  border: '1px solid #fbeed5',
  borderRadius: '5px',
};

const footer = {
  backgroundColor: '#f6f9fc',
  padding: '20px 0',
};

const footerLink = {
  color: '#8898aa',
  fontSize: '12px',
  textDecoration: 'underline',
};

export function AbandonedCartEmail4({
  // customerFirstName, // REMOVED
  returnToCartUrl,
  siteName,
  siteBaseUrl,
  locale,
  t,
  couponCode,
  discountPercentage,
  couponValidityHours = 24, // Default validity for this final email
  unsubscribeUrl,
}: AbandonedCartEmail4Props) {
  const previewText = t('abandonedCart4PreviewFinalOffer', { discountPercentage, defaultValue: `LAST CHANCE! ${discountPercentage}% OFF everything. Don't miss out!` });

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={{ ...paragraph, fontSize: '30px', textAlign: 'center', color: '#d9534f', textTransform: 'uppercase' as const, marginBottom: '20px' }}>
              {t('abandonedCart4MainHeadingFinalOffer', { defaultValue: "Your Biggest Savings End Soon!" })}
            </Heading>
            <Text style={paragraph}>
              {t('abandonedCart4GreetingGeneric', { defaultValue: "Hello," })}
            </Text>
            <Text style={paragraph}>
              {t('abandonedCart4BodyFinalOffer', { siteName, discountPercentage, defaultValue: `This is it – your absolute final opportunity to grab your items from ${siteName} with our best discount yet: a massive ${discountPercentage}% OFF your entire order! We don't want you to miss this.` })}
            </Text>
            
            <Section style={discountSection}>
              <Text style={discountTextHeader}>
                {t('abandonedCart4OfferHeaderFinal', { defaultValue: "Your Final Discount Code:" })}
              </Text>
              <Text>
                <strong style={couponCodeText}>{couponCode}</strong>
              </Text>
              <Text style={discountTextDetail}>
                {t('abandonedCart4OfferDetailFinal', { discountPercentage, defaultValue: `Unlocks ${discountPercentage}% OFF EVERYTHING!` })}
              </Text>
              <Text style={validityText}>
                {t('abandonedCart4OfferValidityFinal', { couponValidityHours, defaultValue: `Act NOW! This code expires in just ${couponValidityHours} hours.` })}
              </Text>
            </Section>

            <Text style={fomoText}>
              {t('abandonedCart4FomoMessage', { defaultValue: "⏰ Time is running out. This is the best offer you'll see for these items!"})}
            </Text>

            <Link href={returnToCartUrl} style={button}>
              {t('abandonedCart4ReturnToCartButtonFinal', { discountPercentage, defaultValue: `Claim ${discountPercentage}% OFF & Checkout Now!` })}
            </Link>

            <Hr style={{...hr, marginTop: '35px'}}/>
            <Text style={paragraph}>
              {t('abandonedCartQuestions', { siteName, defaultValue: `If you encounter any issues, please contact support at ${siteName}.` })}
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

export default AbandonedCartEmail4; 