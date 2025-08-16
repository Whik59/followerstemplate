'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, Mail, Clock } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormDataState {
  name: string;
  email: string;
  reason: string;
  message: string;
  customSubject?: string;
}

const SUPPORT_EMAIL = 'globalshopassist@gmail.com';

export default function SupportPage() {
  const t = useTranslations('Common');
  const [formData, setFormData] = useState<FormDataState>({
    name: '',
    email: '',
    reason: '',
    message: '',
    customSubject: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'success' | 'error' | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReasonChange = (value: string) => {
    setFormData({ ...formData, reason: value, customSubject: value === 'other' ? formData.customSubject : '' });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus(null);
    setSubmissionMessage(null);

    const dataToSubmit = {
      name: formData.name,
      email: formData.email,
      reason: formData.reason,
      message: formData.message,
      customSubject: formData.reason === 'other' ? formData.customSubject : undefined,
    };

    try {
      const response = await fetch('/api/support-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || 'Network response was not ok.');
      }
      
      setSubmissionStatus('success');
      setSubmissionMessage(t('supportFormSuccess'));
      setFormData({ name: '', email: '', reason: '', message: '', customSubject: '' });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Submission error:', error.message, error.stack);
      } else {
        console.error('Submission error:', error);
      }
      setSubmissionStatus('error');
      setSubmissionMessage(t('supportFormError'));
    }
    setIsSubmitting(false);
  };

  const reasonOptions = [
    { value: 'question', label: t('supportFormReasonOptionQuestion') },
    { value: 'refund', label: t('supportFormReasonOptionRefund') },
    { value: 'partnership', label: t('supportFormReasonOptionPartnership') },
    { value: 'technical', label: t('supportFormReasonOptionTechnical') },
    { value: 'other', label: t('supportFormReasonOptionOther') },
  ];

  return (
    <div className="container mx-auto max-w-2xl py-8 md:py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">{t('supportPageTitle')}</CardTitle>
          <CardDescription className="!mt-2">{t('supportPageIntro')}</CardDescription>
          
          <div className="pt-4 space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              <span>{t('supportAvailability')}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="mr-2 h-4 w-4 text-primary" />
              <span>
                {t('supportEmailInfo', { emailAddress: '' })}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-primary hover:underline">{SUPPORT_EMAIL}</a>
              </span>
            </div>
          </div>

        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t('supportFormNameLabel')}</Label>
                <Input 
                  id="name" 
                  name="name"
                  type="text" 
                  placeholder={t('supportFormNamePlaceholder')}
                  value={formData.name}
                  onChange={handleInputChange}
                  required 
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('supportFormEmailLabel')}</Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  placeholder={t('supportFormEmailPlaceholder')}
                  value={formData.email}
                  onChange={handleInputChange}
                  required 
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">{t('supportFormReasonLabel')}</Label>
              <Select
                name="reason"
                value={formData.reason}
                onValueChange={handleReasonChange}
                required
                disabled={isSubmitting}
              >
                <SelectTrigger id="reason">
                  <SelectValue placeholder={t('supportFormReasonPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.reason === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="customSubject">{t('supportFormSubjectLabel')}</Label> 
                <Input
                  id="customSubject"
                  name="customSubject"
                  type="text"
                  placeholder={t('supportFormSubjectPlaceholder')}
                  value={formData.customSubject}
                  onChange={handleInputChange}
                  required={formData.reason === 'other'}
                  disabled={isSubmitting}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">{t('supportFormMessageLabel')}</Label>
              <Textarea 
                id="message" 
                name="message"
                placeholder={t('supportFormMessagePlaceholder')}
                value={formData.message}
                onChange={handleInputChange}
                rows={5}
                required 
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? t('supportFormSubmitting') : t('supportFormSubmitButton')}
              </Button>
            </div>
          </form>

          {submissionStatus && submissionMessage && (
            <Alert 
              variant={submissionStatus === 'success' ? 'default' : 'destructive'} 
              className={`mt-6 ${submissionStatus === 'success' ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300' : ''}`}
            >
              <Terminal className="h-4 w-4" />
              <AlertTitle>{submissionStatus === 'success' ? 'Success!' : 'Error'}</AlertTitle>
              <AlertDescription>
                {submissionMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
            {/* No longer needed as the actual API call is made. 
                Can be removed or kept if you want to inform users about backend processing explicitly. 
                For now, I'll remove it for a cleaner UI once submission works. */}
            {/* <p className='text-xs text-muted-foreground'>{t('supportFormApiNote')}</p> */}
        </CardFooter>
      </Card>
    </div>
  );
} 