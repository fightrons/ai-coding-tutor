import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import { Avatar } from '@/shared/components/Avatar'
import { AvatarPicker } from '@/shared/components/AvatarPicker'
import { useStudentProfile } from '../hooks/useStudentProfile'

type Step = 'age_group' | 'avatar' | 'goal' | 'experience' | 'style'

const STEPS: Step[] = ['age_group', 'avatar', 'goal', 'experience', 'style']

const AGE_GROUPS = [
  { value: 'under_13', label: 'Under 13', description: 'Young coder starting early' },
  { value: '13-17', label: '13-17', description: 'Teen programmer' },
  { value: '18-25', label: '18-25', description: 'College or early career' },
  { value: '26-35', label: '26-35', description: 'Career builder' },
  { value: '36+', label: '36+', description: 'Lifelong learner' },
]

const GOALS = [
  { value: 'build_websites', label: 'Build websites', description: 'Create interactive web pages and apps' },
  { value: 'get_job', label: 'Get a developer job', description: 'Learn skills for a career in tech' },
  { value: 'automate', label: 'Automate tasks', description: 'Write scripts to save time' },
  { value: 'hobby', label: 'Just for fun', description: 'Explore programming as a hobby' },
]

const EXPERIENCE = [
  { value: 'none', label: 'Complete beginner', description: "I've never written code before" },
  { value: 'some', label: 'Some experience', description: "I've tried tutorials or small projects" },
  { value: 'other_language', label: 'Know another language', description: "I'm comfortable in Python, Java, etc." },
]

const STYLES = [
  { value: 'examples', label: 'Show me examples', description: 'I learn best by seeing code in action' },
  { value: 'analogies', label: 'Use analogies', description: 'Compare concepts to real-world things' },
  { value: 'theory', label: 'Explain the theory', description: 'I want to understand why things work' },
]

const onboardingSchema = z.object({
  age_group: z.enum(['under_13', '13-17', '18-25', '26-35', '36+'], {
    message: 'Please select your age group',
  }),
  avatar: z.string().min(1, 'Please choose an avatar'),
  goal: z.string().min(1, 'Please select a goal'),
  experience: z.enum(['none', 'some', 'other_language'], {
    message: 'Please select your experience level',
  }),
  style: z.enum(['examples', 'analogies', 'theory'], {
    message: 'Please select a learning style',
  }),
})

type OnboardingFormData = z.infer<typeof onboardingSchema>

export function OnboardingForm() {
  const navigate = useNavigate()
  const { updateProfile } = useStudentProfile()
  const [step, setStep] = useState<Step>('age_group')
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      age_group: '' as unknown as OnboardingFormData['age_group'],
      avatar: '😊',
      goal: '',
      experience: '' as unknown as OnboardingFormData['experience'],
      style: 'examples',
    },
  })

  const watchedValues = watch()

  async function onSubmit(data: OnboardingFormData) {
    setServerError(null)

    const { error } = await updateProfile({
      age_group: data.age_group,
      avatar_emoji: data.avatar,
      learning_goal: data.goal,
      prior_experience: data.experience,
      preferred_style: data.style,
      current_skill_level: data.experience === 'other_language' ? 'intermediate' : 'beginner',
    })

    if (error) {
      setServerError(error)
      return
    }

    navigate('/learn')
  }

  function handleNext() {
    if (step === 'age_group') setStep('avatar')
    else if (step === 'avatar') setStep('goal')
    else if (step === 'goal') setStep('experience')
    else if (step === 'experience') setStep('style')
  }

  function handleBack() {
    if (step === 'avatar') setStep('age_group')
    else if (step === 'goal') setStep('avatar')
    else if (step === 'experience') setStep('goal')
    else if (step === 'style') setStep('experience')
  }

  const canProceed =
    (step === 'age_group' && watchedValues.age_group) ||
    (step === 'avatar' && watchedValues.avatar) ||
    (step === 'goal' && watchedValues.goal) ||
    (step === 'experience' && watchedValues.experience) ||
    (step === 'style' && watchedValues.style)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {step === 'age_group' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">What's your age group?</h2>
            <p className="text-sm text-muted-foreground">This helps us present concepts in the best way for you</p>
          </div>
          <Controller
            name="age_group"
            control={control}
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3">
                {AGE_GROUPS.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`age-${option.value}`}
                    className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary"
                  >
                    <RadioGroupItem value={option.value} id={`age-${option.value}`} className="mt-0.5" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            )}
          />
        </div>
      )}

      {step === 'avatar' && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Choose your avatar</h2>
            <p className="text-sm text-muted-foreground">Pick an emoji to represent you</p>
          </div>
          <Controller
            name="avatar"
            control={control}
            render={({ field }) => (
              <>
                <div className="flex justify-center py-4">
                  <Avatar emoji={field.value} size="lg" />
                </div>
                <AvatarPicker value={field.value} onChange={field.onChange} />
              </>
            )}
          />
        </div>
      )}

      {step === 'goal' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">What's your goal?</h2>
            <p className="text-sm text-muted-foreground">This helps us tailor your learning path</p>
          </div>
          <Controller
            name="goal"
            control={control}
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3">
                {GOALS.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`goal-${option.value}`}
                    className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary"
                  >
                    <RadioGroupItem value={option.value} id={`goal-${option.value}`} className="mt-0.5" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            )}
          />
        </div>
      )}

      {step === 'experience' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">What's your experience level?</h2>
            <p className="text-sm text-muted-foreground">We'll adjust the pace accordingly</p>
          </div>
          <Controller
            name="experience"
            control={control}
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3">
                {EXPERIENCE.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`exp-${option.value}`}
                    className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary"
                  >
                    <RadioGroupItem value={option.value} id={`exp-${option.value}`} className="mt-0.5" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            )}
          />
        </div>
      )}

      {step === 'style' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">How do you learn best?</h2>
            <p className="text-sm text-muted-foreground">The tutor will adapt to your style</p>
          </div>
          <Controller
            name="style"
            control={control}
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3">
                {STYLES.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`style-${option.value}`}
                    className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary"
                  >
                    <RadioGroupItem value={option.value} id={`style-${option.value}`} className="mt-0.5" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            )}
          />
        </div>
      )}

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex gap-3">
        {step !== 'age_group' && (
          <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
            Back
          </Button>
        )}
        {step === 'style' ? (
          <Button type="submit" disabled={!canProceed || isSubmitting} className="flex-1">
            {isSubmitting ? 'Saving...' : 'Start Learning'}
          </Button>
        ) : (
          <Button type="button" onClick={handleNext} disabled={!canProceed} className="flex-1">
            Continue
          </Button>
        )}
      </div>

      <div className="flex justify-center gap-2">
        {STEPS.map((s) => (
          <div
            key={s}
            className={`h-2 w-2 rounded-full ${s === step ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>
    </form>
  )
}
