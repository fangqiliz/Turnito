import { Check } from 'lucide-react'
import styles from '../BookingPage.module.css'

export default function BookingStepper({ steps, currentStep }) {
  return (
    <div className={styles.stepper}>
      {steps.map((label, i) => (
        <div
          key={label}
          className={[
            styles.step,
            i === currentStep ? styles.activeStep  : '',
            i <  currentStep ? styles.completedStep : '',
          ].join(' ')}
        >
          <div className={styles.stepNumber}>
            {i < currentStep ? <Check size={14} /> : i + 1}
          </div>
          <span className={styles.stepLabel}>{label}</span>
        </div>
      ))}
    </div>
  )
}
