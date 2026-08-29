import { useTranslation } from 'react-i18next';

export default function HowItWorksSection() {
  const { t } = useTranslation('common');

  const steps = [
    {
      icon: 'ri-user-add-line',
      title: t('howItWorks.step1Title'),
      description: t('howItWorks.step1Desc'),
      color: 'bg-primary-500',
    },
    {
      icon: 'ri-search-line',
      title: t('howItWorks.step2Title'),
      description: t('howItWorks.step2Desc'),
      color: 'bg-accent-500',
    },
    {
      icon: 'ri-file-list-3-line',
      title: t('howItWorks.step3Title'),
      description: t('howItWorks.step3Desc'),
      color: 'bg-secondary-500',
    },
    {
      icon: 'ri-checkbox-circle-line',
      title: t('howItWorks.step4Title'),
      description: t('howItWorks.step4Desc'),
      color: 'bg-primary-500',
    },
  ];

  return (
    <section className="py-14 md:py-20 bg-background-50 dark:bg-background-50">
      <div className="px-4 md:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-heading font-bold text-2xl md:text-3xl lg:text-4xl text-foreground-950 dark:text-foreground-950 mb-3">
            {t('howItWorks.title')}
          </h2>
          <p className="text-sm md:text-base text-foreground-600 max-w-lg mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {steps.map((step, idx) => (
            <div key={idx} className="relative text-center">
              {/* Connector line (desktop only) */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px bg-background-300 dark:bg-background-300" />
              )}

              <div className={`w-14 h-14 md:w-16 md:h-16 mx-auto rounded-2xl ${step.color} flex items-center justify-center mb-4 md:mb-5 shadow-sm`}>
                <i className={`${step.icon} text-xl md:text-2xl text-white`} />
              </div>
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-background-200 dark:bg-background-200 text-xs font-bold text-foreground-600 mb-3">
                {idx + 1}
              </div>
              <h3 className="font-heading font-semibold text-base md:text-lg text-foreground-950 dark:text-foreground-950 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-foreground-600 leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}