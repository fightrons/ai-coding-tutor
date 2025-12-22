// Proactive prompts for different struggle scenarios
export const PROACTIVE_PROMPTS = {
  syntaxError:
    "I noticed you're getting a syntax error. Would you like me to help explain what's happening?",
  multipleFailures:
    "It looks like you've been working on this for a bit. Want a hint to help you move forward?",
  logicError:
    "Your code is running, but the output isn't quite right. Would you like some guidance?",
  stuck:
    "Take your time! Let me know if you'd like some help thinking through this problem.",
} as const

// Response templates for mock tutor (categorized by scenario)
export const MOCK_RESPONSES = {
  syntaxError: [
    "I see there's a syntax error in your code. Let's look at it together.\n\nThe error message is pointing to a specific line. Check if you might be missing:\n- A closing parenthesis `)` or bracket `}`\n- A semicolon at the end of a statement\n- Proper quotes around strings\n\nTake a look and let me know what you find!",
    "Syntax errors can be tricky! The JavaScript interpreter is telling us something doesn't look right.\n\nA few common things to check:\n1. Are all your brackets paired up? Every `{` needs a `}`\n2. Are your variable names spelled consistently?\n3. Did you use `=` for assignment and `===` for comparison?\n\nWhat do you notice when you look at your code?",
  ],
  testFailing: [
    "Your code is running without errors - that's great progress! Now let's think about why the output isn't matching what we expect.\n\nLook at the test that's failing. What's the difference between what your code produces and what it should produce?",
    "Good news: no syntax errors! The test is expecting a specific output though.\n\nHint: Think about what the exercise is asking for. Are you:\n- Returning the right type of value?\n- Handling the input correctly?\n- Using the right operation?",
  ],
  generalHelp: [
    "I'm here to help! What specifically are you finding tricky about this exercise?\n\nIf you're not sure where to start, try breaking it down:\n1. What input do you have?\n2. What output do you need?\n3. What steps would transform one into the other?",
    "Happy to help you work through this!\n\nTell me more about where you're stuck. Is it:\n- Understanding what the exercise is asking?\n- Figuring out which JavaScript concept to use?\n- Getting your code to produce the right result?",
  ],
  encouragement: [
    "You're making progress! Every error you work through is teaching you something valuable.",
    "Keep going! Programming is all about trying things, seeing what happens, and adjusting. You're doing great.",
    "Don't worry if it takes a few tries - that's completely normal. The key is understanding *why* something works or doesn't.",
  ],
  hintLevel1: [
    "Let me give you a small nudge in the right direction.\n\nThink about the problem step by step. What's the very first thing your code needs to do with the input?",
    "Here's a hint without giving too much away:\n\nConsider what JavaScript method or operator would help you work with this type of data. What have you learned in this lesson that might apply?",
  ],
  hintLevel2: [
    "Let me be a bit more specific.\n\nLook at the lesson content again - there's an example that's very similar to what you need to do here. Can you adapt that approach?",
    "Here's a more direct hint:\n\nFor this exercise, you'll want to use what you learned about variables. Make sure you're storing your result and then outputting it correctly.",
  ],
  hintLevel3: [
    "Okay, let me give you a clearer direction.\n\nYour code should:\n1. Take the input value\n2. Perform the required operation\n3. Output the result using console.log()\n\nWhich step do you think needs adjustment?",
  ],
} as const

// Get a random response from a category
export function getRandomResponse(
  category: keyof typeof MOCK_RESPONSES
): string {
  const responses = MOCK_RESPONSES[category]
  return responses[Math.floor(Math.random() * responses.length)]
}
