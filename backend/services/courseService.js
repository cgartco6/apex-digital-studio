const openai = require('../config/openai');

class CourseService {
  async generateCourseOutline(topic, level = 'beginner', modules = 5) {
    const prompt = `Create a ${level} level course outline on "${topic}" with ${modules} modules. For each module, include title and 3-5 lesson titles. Output in JSON format.`;
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000
    });
    const content = response.data.choices[0].message.content;
    return JSON.parse(content);
  }

  async generateLessonContent(moduleTitle, lessonTitle, style = 'lecture') {
    const prompt = `Write detailed lesson content for "${lessonTitle}" in the module "${moduleTitle}". Style: ${style}. Include learning objectives, main points, examples, and a summary.`;
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000
    });
    return response.data.choices[0].message.content;
  }
}
module.exports = new CourseService();
