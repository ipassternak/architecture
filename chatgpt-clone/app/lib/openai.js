({
  model: 'gpt-3.5-turbo',
  userRole: 'user',
  assistantRole: 'assistant',

  provider: new npm.openai.OpenAI({
    apiKey: common.env('OPENAI_API_KEY'),
  }),

  async prompt(content, conversation) {
    const userPrompt = {
      role: this.userRole,
      content,
    };
    try {
      const res = await this.provider.chat.completions.create({
        messages: [...conversation, userPrompt],
        model: this.model,
      });
      const { message: assistantAnswer } = res.choices[0];
      return [userPrompt, assistantAnswer];
    } catch (error) {
      throw new Error(
        'Prompt failed due to internal server error. Try again later',
        500,
        { pass: true },
      );
    }
  },
})