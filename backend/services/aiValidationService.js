const { validatePDF, validateImage, validateVideo } = require('./fileValidators');
const complianceService = require('./complianceService');

class AIValidationService {
  async validateProduct(product, type) {
    let issues = [];
    switch(type) {
      case 'course':
        issues = await this.validateCourse(product);
        break;
      case 'document':
        issues = await this.validateDocument(product);
        break;
      case 'design':
        issues = await this.validateDesign(product);
        break;
    }
    const compliance = await complianceService.check(product);
    if (!compliance.compliant) {
      issues.push(...compliance.issues);
    }
    return { valid: issues.length === 0, issues, fixes: this.suggestFixes(issues) };
  }

  async validateCourse(course) {
    const issues = [];
    if (!course.title || course.title.length < 5) issues.push('Title too short');
    if (!course.modules || course.modules.length === 0) issues.push('No modules');
    for (const module of course.modules) {
      if (!module.lessons || module.lessons.length === 0) issues.push(`Module ${module.title} has no lessons`);
      for (const lesson of module.lessons) {
        if (!lesson.videoUrl && !lesson.content) issues.push(`Lesson ${lesson.title} missing content`);
        else if (lesson.videoUrl && !await validateVideo(lesson.videoUrl)) issues.push(`Lesson ${lesson.title} video invalid`);
      }
    }
    return issues;
  }

  async validateDocument(doc) {
    const issues = [];
    if (!doc.fileUrl) issues.push('No file uploaded');
    else {
      const ext = doc.fileUrl.split('.').pop().toLowerCase();
      if (ext === 'pdf') {
        if (!await validatePDF(doc.fileUrl)) issues.push('Invalid PDF file');
      } else {
        issues.push('Unsupported file format (only PDF allowed for documents)');
      }
    }
    return issues;
  }

  suggestFixes(issues) {
    // AI-generated fixes (mock)
    return issues.map(issue => {
      if (issue.includes('Title too short')) return 'Add more descriptive title (min 5 characters)';
      if (issue.includes('No modules')) return 'Create at least one module';
      // ... more fixes
      return 'Manual review required';
    });
  }
}
module.exports = new AIValidationService();
