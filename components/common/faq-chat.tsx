"use client";

import { useState, useRef } from "react";
import { X, Send, ChevronDown, ChevronUp, HelpCircle } from "lucide-react"; // Added HelpCircle
import { useTranslations } from 'next-intl';
import { useUIContext } from '@/context/ui-context'; // Import useUIContext

interface FaqChatProps {
  whatsappNumber: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export function FaqChat({ whatsappNumber }: FaqChatProps) {
  const t = useTranslations('Common');
  const { isProductStickyBarVisible } = useUIContext(); // Consume context
  const faqItems: FaqItem[] = t.raw('faqItems');

  const [isOpen, setIsOpen] = useState(false);
  const [contactReason, setContactReason] = useState("general");
  const [orderNumber, setOrderNumber] = useState("");
  const [openFaqItem, setOpenFaqItem] = useState<string | null>(null);
  
  const [isContactSectionVisible, setIsContactSectionVisible] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const contactSectionRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    // Reset contact section visibility when chat is closed then reopened
    if (isOpen) { // This means it's about to be closed
      setIsContactSectionVisible(false);
      setIsContactOpen(false);
    }
  };

  const toggleFaqItem = (itemId: string) => {
    setOpenFaqItem(openFaqItem === itemId ? null : itemId);
  };
  
  const handleShowContactForm = () => {
    setIsContactSectionVisible(true);
    setIsContactOpen(true);
    setTimeout(() => {
      contactSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const toggleContactAccordion = () => {
    setIsContactOpen(!isContactOpen);
  };

  const handleContactSubmit = () => {
    if (!orderNumber && (contactReason === "refund" || contactReason === "track")) {
      alert(t('errorMessageOrderNumberMissing'));
      return;
    }

    let message = `Hello, I have a ${t(`reasons.${contactReason}`)} query.`;
    if (orderNumber) {
      message += ` My order number is ${orderNumber}.`;
    }
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // If product sticky bar is visible, don't render this component
  if (isProductStickyBarVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-amber-600 transition-colors text-sm font-medium flex items-center space-x-2"
          aria-label={t('openChatLabel')}
        >
          <HelpCircle size={18} />
          <span>{t('floatingButtonLabel')}</span>
        </button>
      )}

      {isOpen && (
        <div className="bg-white w-80 md:w-96 max-h-[80vh] shadow-xl rounded-lg flex flex-col">
          <header className="bg-amber-500 text-white p-4 flex flex-col items-center rounded-t-lg text-center">
            <div className="w-full flex justify-between items-center mb-1">
              <h3 className="font-semibold text-lg flex-grow text-center">{t('title')}</h3>
              <button
                onClick={toggleChat}
                className="text-white hover:text-gray-200"
                aria-label={t('closeChatLabel')}
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-xs text-amber-100">{t('chatSubHeader')}</p>
          </header>

          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {/* Prompt to show Contact Us section - MOVED TO TOP */}
            {!isContactSectionVisible && (
              <div className="text-center py-3 border-b mb-4">
                <p className="text-sm text-gray-600 mb-2">{t('didNotFindAnswer')}</p>
                <button
                  onClick={handleShowContactForm}
                  className="text-sm text-amber-500 hover:text-amber-600 font-semibold hover:underline"
                >
                  {t('clickToContact')}
                </button>
              </div>
            )}

            {/* FAQ Accordion Section */}
            <div className="pb-2 mb-2">
              <div className="space-y-2">
                {faqItems.map((item) => (
                  <div key={item.id} className="border rounded">
                    <button
                      onClick={() => toggleFaqItem(item.id)}
                      className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-t focus:outline-none"
                    >
                      <span className="font-medium text-sm text-gray-800">{item.question}</span>
                      {openFaqItem === item.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {openFaqItem === item.id && (
                      <div className="p-3 bg-white rounded-b text-sm text-gray-700 border-t">
                        <p>{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Us Section (conditionally rendered) */}
            {isContactSectionVisible && (
              <div ref={contactSectionRef} className="border-t pt-4">
                <button
                  onClick={toggleContactAccordion}
                  className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 rounded mb-2"
                >
                  <span className="font-semibold text-md">{t('contactSectionTitle')}</span>
                  {isContactOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {isContactOpen && (
                  <div className="p-3 bg-gray-50 rounded space-y-3">
                    <div>
                      <label
                        htmlFor="contactReason"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {t('contactReasonLabel')}
                      </label>
                      <select
                        id="contactReason"
                        value={contactReason}
                        onChange={(e) => setContactReason(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="general">{t('reasons.general')}</option>
                        <option value="refund">{t('reasons.refund')}</option>
                        <option value="track">{t('reasons.track')}</option>
                      </select>
                    </div>

                    {(contactReason === "refund" || contactReason === "track") && (
                      <div>
                        <label
                          htmlFor="orderNumber"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          {t('orderNumberLabel')}
                        </label>
                        <input
                          type="text"
                          id="orderNumber"
                          value={orderNumber}
                          onChange={(e) => setOrderNumber(e.target.value)}
                          placeholder={t('orderNumberPlaceholder')}
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    )}

                    <button
                      onClick={handleContactSubmit}
                      className="w-full bg-amber-500 text-white py-2 px-4 rounded-md hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Send size={18} />
                      <span>{t('sendMessageButton')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}