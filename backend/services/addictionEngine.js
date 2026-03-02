// This would be a real service; here we just log
class AddictionEngine {
  async rewardAction(userId, action, value = 0) {
    console.log(`🏆 User ${userId} earned points for ${action}: ${value}`);
    // In production, update user points, check achievements, etc.
  }
}

module.exports = new AddictionEngine();
