import { checkDailyUsageLimit, incrementUsageCount } from '@/components/UsageGuardRail';

describe('Usage Guard Rail', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('checkDailyUsageLimit', () => {
    it('should return allowed=true when no usage data exists', () => {
      const { allowed, currentCount } = checkDailyUsageLimit(10);
      expect(allowed).toBe(true);
      expect(currentCount).toBe(0);
    });

    it('should return allowed=false when limit exceeded', () => {
      // Set up localStorage with exceeded limit
      const today = new Date().toDateString();
      localStorage.setItem('quicknews-usage', JSON.stringify({
        date: today,
        count: 11
      }));

      const { allowed, currentCount } = checkDailyUsageLimit(10);
      expect(allowed).toBe(false);
      expect(currentCount).toBe(11);
    });

    it('should reset count on new day', () => {
      // Set up localStorage with yesterday's date
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      localStorage.setItem('quicknews-usage', JSON.stringify({
        date: yesterday,
        count: 5
      }));

      const { allowed, currentCount } = checkDailyUsageLimit(10);
      expect(allowed).toBe(true);
      expect(currentCount).toBe(0);
    });
  });

  describe('incrementUsageCount', () => {
    it('should increment count when called', () => {
      incrementUsageCount();
      const data = JSON.parse(localStorage.getItem('quicknews-usage') || '{}');
      expect(data.count).toBe(1);
    });

    it('should reset count when day changes', () => {
      // Set up yesterday's usage
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      localStorage.setItem('quicknews-usage', JSON.stringify({
        date: yesterday,
        count: 5
      }));

      incrementUsageCount();
      const data = JSON.parse(localStorage.getItem('quicknews-usage') || '{}');
      expect(data.count).toBe(1);
      expect(data.date).toBe(new Date().toDateString());
    });

    it('should increment existing count within same day', () => {
      const today = new Date().toDateString();
      localStorage.setItem('quicknews-usage', JSON.stringify({
        date: today,
        count: 3
      }));

      incrementUsageCount();
      const data = JSON.parse(localStorage.getItem('quicknews-usage') || '{}');
      expect(data.count).toBe(4);
    });
  });
});