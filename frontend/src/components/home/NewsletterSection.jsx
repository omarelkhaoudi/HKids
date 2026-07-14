import { motion } from 'framer-motion';

export default function NewsletterSection({ 
  newsletterEmail, 
  setNewsletterEmail, 
  handleNewsletterSubmit, 
  newsletterStatus, 
  newsletterLoading 
}) {
  return (
    <section className="bg-background py-12 md:py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-primary-50 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="flex items-center gap-6 relative z-10 w-full md:w-1/2">
              <div className="w-20 h-20 flex-shrink-0 bg-white rounded-3xl shadow-sm flex items-center justify-center text-4xl transform -rotate-6 border border-primary-100">
                💌
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-surface-900 mb-2">
                  Rejoignez notre univers magique
                </h2>
                <p className="text-surface-600">
                  Recevez des histoires exclusives, des conseils pour parents et les nouveautés HKids.
                </p>
              </div>
            </div>

            <div className="w-full md:w-1/2 relative z-10 flex justify-center md:justify-end">
              <form onSubmit={handleNewsletterSubmit} className="w-full max-w-md flex flex-col">
                <div className="relative flex items-center">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(event) => {
                      setNewsletterEmail(event.target.value);
                    }}
                    placeholder="Votre adresse email"
                    className="w-full pl-6 pr-32 py-4 rounded-full bg-white border border-transparent focus:border-primary-300 focus:ring-4 focus:ring-primary-100 outline-none text-surface-900 shadow-[0_4px_15px_rgba(0,0,0,0.05)] transition-all font-medium"
                    aria-label="Adresse e-mail"
                    disabled={newsletterLoading}
                    required
                  />
                  <button
                    type="submit"
                    disabled={newsletterLoading}
                    className="absolute right-2 top-2 bottom-2 px-6 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-full transition-colors disabled:opacity-50 flex items-center gap-2"
                    aria-label="S'abonner"
                  >
                    S'abonner <span className="text-xl leading-none mb-0.5">→</span>
                  </button>
                </div>
                
                {newsletterStatus === 'success' && (
                  <p className="mt-3 text-sm text-secondary-600 font-medium px-4">
                    ✓ Merci de votre inscription.
                  </p>
                )}
                {newsletterStatus === 'saved' && (
                  <p className="mt-3 text-sm text-surface-600 font-medium px-4">
                    Inscription enregistrée.
                  </p>
                )}
                {newsletterStatus === 'error' && (
                  <p className="mt-3 text-sm text-red-500 font-medium px-4">
                    Une erreur est survenue.
                  </p>
                )}
                <p className="mt-3 text-xs text-surface-400 font-medium px-4">
                  * Pas de spam, désinscription en un clic.
                </p>
              </form>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
