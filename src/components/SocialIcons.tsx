type SocialIconsProps = {
  className?: string;
};

// Non-clickable social and email brand marks, styled by the .home-social-icons rules.
export default function SocialIcons({ className }: SocialIconsProps) {
  return (
    <div
      className={['home-social-icons', className].filter(Boolean).join(' ')}
      role="group"
      aria-label="Social platforms and email"
    >
      <span className="home-social-icons__item home-social-icons__item--whatsapp" role="img" aria-label="WhatsApp" title="WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 2 17.7L.5 23.5l6-1.6A11.8 11.8 0 0 0 20.5 3.5ZM12 21a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.5.9.9-3.4-.2-.4A9.8 9.8 0 1 1 12 21Zm5.4-7.3c-.3-.2-1.7-.9-2-.9s-.5-.2-.7.2-.8.9-1 1.1-.4.2-.7.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.7l.5-.5.2-.5c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.8 1.2 3 .2.4.4.6a10.8 10.8 0 0 0 4.2 3.7c.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.7-.7 1.9-1.3s.2-1.2.2-1.3-.2-.2-.5-.3Z"/></svg></span>
      <span className="home-social-icons__item home-social-icons__item--instagram" role="img" aria-label="Instagram" title="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.7" r="1.2"/></svg></span>
      <span className="home-social-icons__item home-social-icons__item--facebook" role="img" aria-label="Facebook" title="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4Z"/></svg></span>
      <span className="home-social-icons__item home-social-icons__item--tiktok" role="img" aria-label="TikTok" title="TikTok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.6 8.2a6.8 6.8 0 0 1-4.2-1.4v8.1a5.6 5.6 0 1 1-5.6-5.6c.4 0 .8 0 1.2.1v3.1a2.6 2.6 0 1 0 1.7 2.4V2.5h3.1c.2 2.1 1.7 3.8 3.8 4.1v1.6Z"/></svg></span>
      <span className="home-social-icons__item home-social-icons__item--gmail" role="img" aria-label="Gmail" title="Gmail"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5H18V8.2l-6 4.5-6-4.5V20h-.5A2.5 2.5 0 0 1 3 17.5v-11Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="m4 6 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
    </div>
  );
}
