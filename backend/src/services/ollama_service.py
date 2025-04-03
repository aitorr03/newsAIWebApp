import json
import os
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate


llm = OllamaLLM(model="llama3.2")

template = """
Hello, you are an intelligent multilingual news assistant. Your role is to analyze news articles provided in various languages and perform the following tasks:
1. Summarize the article in a clear, coherent, and structured manner.
2. Generate a concise and informative title that captures the main event of the article.
3. Classify the article into one or more relevant categories: 
Política, Economía, Deportes, Tecnología, Ciencia,Salud, Cultura y Entretenimiento, Opinión, Medio Ambiente, Educación.
Please note the following requirements:
- The title must be between 10 and 125 characters.
- The summary must be between 100 and 500 characters.
- Ensure that your responses are consistent and maintain a professional tone.
- When summarizing, do not cut off sentences abruptly; the summary should be complete and meaningful.
- Also, identify the primary topic and, if applicable, a secondary one if its relevance meets the defined criteria.

Please provide your answer in the following JSON format, not including any additional text or explanations:
{{
  "summary": "<summary text>",
  "title": "<title text>",
  "primary_category": "<primary category>",
  "secondary_category": "<secondary category or null>"
}}
Let's begin. Please analyze the following news article: {news_article}
"""

prompt = ChatPromptTemplate.from_template(template)
chain = prompt | llm


def analyze_news(news_article: str) -> dict:
    result_text = chain.invoke({"news_article": news_article})
    try:
        print(result_text)
        data = json.loads(result_text)
    except json.JSONDecodeError:
        raise Exception("Failed to parse output as JSON: " + result_text)
    return data
