import { handler } from '../handler';
import axios from 'axios';
import AWS from 'aws-sdk';

// Mock axios and AWS SDK
jest.mock('axios');
jest.mock('aws-sdk', () => ({
  Comprehend: jest.fn().mockImplementation(() => ({
    detectSentiment: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Sentiment: 'POSITIVE'
      })
    })
  }))
}));

describe('News Sentiment Handler', () => {
  const mockNewsApiResponse = {
    data: {
      articles: [
        {
          title: 'Test Article 1',
          description: 'Test Description 1'
        },
        {
          title: 'Test Article 2',
          description: 'Test Description 2'
        },
        {
          title: 'Test Article 3',
          description: 'Test Description 3'
        }
      ]
    }
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset process.env
    process.env.NEWS_API_KEY = 'test-api-key';
  });

  it('should fetch news and analyze sentiment successfully', async () => {
    // Mock axios.get to return test articles
    (axios.get as jest.Mock).mockResolvedValueOnce(mockNewsApiResponse);

    const event = {
      queryStringParameters: {
        keyword: 'test'
      }
    };

    const response = await handler(event);

    // Verify response structure
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveLength(3);
    expect(body[0]).toHaveProperty('headline');
    expect(body[0]).toHaveProperty('summary');
    expect(body[0]).toHaveProperty('sentiment');

    // Verify axios called with correct params
    expect(axios.get).toHaveBeenCalledWith('https://newsapi.org/v2/everything', {
      params: {
        q: 'test',
        apiKey: 'test-api-key',
        pageSize: 3
      }
    });

    // Verify AWS Comprehend called for each article
    const comprehendInstance = new AWS.Comprehend();
    expect(comprehendInstance.detectSentiment).toHaveBeenCalledTimes(3);
  });

  it('should return error when NEWS_API_KEY is missing', async () => {
    // Remove API key from env
    delete process.env.NEWS_API_KEY;

    const event = {
      queryStringParameters: {
        keyword: 'test'
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Error processing request');
    expect(body.error).toBe('NEWS_API_KEY environment variable is not defined');
  });

  it('should use default keyword "AI" when none provided', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce(mockNewsApiResponse);

    const event = {
      queryStringParameters: {}
    };

    await handler(event);

    // Verify axios called with default keyword
    expect(axios.get).toHaveBeenCalledWith('https://newsapi.org/v2/everything', {
      params: {
        q: 'AI',
        apiKey: 'test-api-key',
        pageSize: 3
      }
    });
  });

  it('should handle empty articles response gracefully', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: {
        articles: []
      }
    });

    const event = {
      queryStringParameters: {
        keyword: 'test'
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveLength(0);
  });
});