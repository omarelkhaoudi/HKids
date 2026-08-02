import { motion } from 'framer-motion';
import { MailIcon } from '../../components/Icons';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export default function NewsletterSection({
  t,
  newsletterEmail,
  setNewsletterEmail,
  handleNewsletterSubmit,
  newsletterStatus,
  newsletterLoading,
}) {
  const reducedMotion = useReducedMotion();

  return (
    <section className="hkids-section bg-gradient-to-b from-background via-primary-50/40 to-white" aria-labelledby="home-newsletter-title">
      <div className="hkids-section-inner">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="hkids-premium-surface flex flex-col items-center justify-between gap-8 p-8 md:flex-row md:p-12">
            <div className="relative z-10 flex w-full items-center gap-6 md:w-1/2">
              <div className="grid h-20 w-20 flex-shrink-0 place-items-center rounded-3xl border border-primary-100 bg-white text-primary-700 shadow-card" aria-hidden="true">
                <MailIcon className="h-9 w-9" />
              </div>
              <div>
                <h2 id="home-newsletter-title" className="mb-2 text-2xl font-black text-foreground md:text-4xl">
                  {t.homeNewsletterTitle}
                </h2>
                <p className="font-semibold leading-relaxed text-foreground-secondary">
                  {t.homeNewsletterSubtitle}
                </p>
              </div>
            </div>

            <div className="relative z-10 flex w-full justify-center md:w-1/2 md:justify-end">
              <form onSubmit={handleNewsletterSubmit} className="flex w-full max-w-md flex-col">
                <div className="relative flex items-center">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(event) => setNewsletterEmail(event.target.value)}
                    placeholder={t.homeNewsletterPlaceholder}
                    className="hkids-input w-full rounded-full bg-white py-4 pe-32 ps-6 font-bold shadow-soft"
                    aria-label={t.homeNewsletterPlaceholder}
                    disabled={newsletterLoading}
                    required
                  />
                  <button
                    type="submit"
                    disabled={newsletterLoading}
                    className="absolute bottom-2 end-2 top-2 flex min-h-[2.75rem] items-center gap-2 rounded-full bg-primary-600 px-6 font-black text-white transition-colors hover:bg-primary-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
                    aria-label={t.homeNewsletterSubscribe}
                  >
                    {newsletterLoading ? '...' : t.homeNewsletterSubscribe}
                  </button>
                </div>

                {newsletterStatus === 'success' && (
                  <p className="mt-3 px-4 text-sm font-bold text-primary-700" role="status">
                    {t.homeNewsletterSuccess}
                  </p>
                )}
                {newsletterStatus === 'saved' && (
                  <p className="mt-3 px-4 text-sm font-bold text-foreground-secondary" role="status">
                    {t.homeNewsletterSaved}
                  </p>
                )}
                {newsletterStatus === 'error' && (
                  <p className="mt-3 px-4 text-sm font-bold text-hkids-brown-dark" role="alert">
                    {t.homeNewsletterError}
                  </p>
                )}
                <p className="mt-3 px-4 text-xs font-bold text-foreground-muted">
                  {t.homeNewsletterDisclaimer}
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
