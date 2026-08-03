import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getHoverMotion, kidsTouchFeedback } from '../../constants/kidsMotion';
import { getNonReaderAction } from '../../utils/nonReaderExperience';
import { playKidsUiSound } from '../../utils/kidsUiSound';

export function KidsIconAction({
  action = 'play',
  label,
  pictogram,
  icon: Icon,
  active = false,
  disabled = false,
  showLabel = false,
  size = 'lg',
  tone,
  sound = 'tap',
  className = '',
  type = 'button',
  onClick,
  children,
  ...props
}) {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const config = getNonReaderAction(action);
  const resolvedLabel = label || t(config.labelKey) || config.labelKey;
  const resolvedPictogram = pictogram || config.pictogram;
  const resolvedTone = tone || config.tone || 'primary';

  return (
    <motion.button
      type={type}
      {...getHoverMotion(reducedMotion, {
        whileHover: disabled ? undefined : { y: -2, scale: 1.02 },
        ...kidsTouchFeedback,
      })}
      onClick={(event) => {
        if (!disabled && sound) playKidsUiSound(sound);
        onClick?.(event);
      }}
      disabled={disabled}
      aria-label={resolvedLabel}
      title={resolvedLabel}
      aria-pressed={props['aria-pressed'] ?? (active ? true : undefined)}
      className={`kids-icon-control kids-icon-control--${size} kids-icon-control--${resolvedTone} ${active ? 'is-active' : ''} ${className}`}
      {...props}
    >
      <span className="kids-icon-control-symbol" aria-hidden="true">
        {Icon ? <Icon className="kids-icon-control-svg" /> : resolvedPictogram}
      </span>
      {showLabel ? (
        <span className="kids-icon-control-label">{children || resolvedLabel}</span>
      ) : (
        <span className="sr-only">{children || resolvedLabel}</span>
      )}
    </motion.button>
  );
}

export default KidsIconAction;
