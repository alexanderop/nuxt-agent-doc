---
title: "Software Testing with Generative AI"
author: "Alexander Opalic"
pubDatetime: 2025-01-01T00:00:00Z
sourceType: "book"
sourceAuthor: "Mark Winteringham"
sourceUrl: "https://www.manning.com/books/software-testing-with-generative-ai"
description: "A beginner friendly guide for leveraging AI in software testing practices"
tags: ["testing", "ai", "book-summary"]
draft: false
highlights:
  [
    {
      quote: "Creating and managing test data can be one of the most complex aspects of testing.",
      comment: "This is true - as developers, we have a bias to generate test data that makes our lives easier and we don't keep edge cases in mind.",
    },
    {
      quote: "Shift-left testing means bringing testing analysis earlier into the development process, ideally around the point at which ideas are being discussed and details clarified.",
      comment: "I like this idea - we can build better software by incorporating testing plans early in development. Deciding which tests can be automated and which require manual verification should be part of the initial planning process rather than an afterthought.",
    },
    {
      quote: "We can see AI agents as an approach to use when we reach a point where our prompts become too complicated, or we want to extend them to interface with third-party systems.",
      comment: "This highlights the practical limitations of simple prompts and when to consider more sophisticated AI approaches.",
    },
  ]
---

## Why I read this book

I read this book to enhance my use of AI in my development workflow. Testing is a crucial part of being a developer. Having worked with an excellent QA Engineer previously, I understand the importance of writing good automated tests while also considering manual testing strategies and exploratory testing. As AI accelerates code production, we need more sophisticated testing techniques.

## What I learned

### AI-Assisted Test Development

GenAi like ChatGPT excels at:

Creating page objects from HTML (a design pattern that creates an abstraction layer for UI testing)[^3]. Example: In Chapter 7, the author demonstrates creating a ContactFormPage class by providing HTML to ChatGPT, which generates a complete Java class with Selenium annotations and interaction methods.

Also ofc to write tests faster or boilerplate code.

### Test Data Generation

LLMs have demonstrated particular strength in:

- Generating and transforming test data effectively
- Integration with OpenAI API for automated data creation
- Creating realistic, diverse test datasets
- Supporting both unit tests and integration testing
- Automatically seeding test data via SQL statements

The book suggests integrating OpenAI's API directly into the testing pipeline to generate synthetic test data dynamically. While innovative, I'm somewhat skeptical about the practicality - introducing API calls to an LLM during test execution could introduce unnecessary complexity and potential failure points.

A more pragmatic approach might be using AI tools during development to generate a comprehensive test dataset that can be committed to the codebase.
I would not recommend this approach, as there are enough tools available that generate good test data without the complications of LLMs.
The most elegant solution would probably be to use property-based testing.[^1]

### Test Planning & Analysis

With well-crafted prompts[^4], AI can effectively identify risks and generate viable test plans. You can directly convert tickets into comprehensive test plans. Using advanced techniques like RAG and fine-tuning, you can further automate this process. The basic approach involves:

1. Setting up a chat interface
2. Using RAG to provide the AI with necessary knowledge
3. Implementing fine-tuning to enhance accuracy
4. Querying with questions like "What are the risks of Ticket-12345?"

### Best Prompt from the Book

The book's standout prompt focuses on test data generation, applicable for various data generation needs including SQL statements. Here's the prompt:

```
You are a JSON data generator. Generate 5 JSON objects in an array and check that 5
JSON objects have been created before outputting the results.

We use different delimiters to set out the rules for our data requirements:

* Each parameter is identified with a % sign.
* Each column is described in order of key, value data type and options using the |
sign.
* If a column data option says random, randomize data based on the suggested format
and column name.

Here are the instructions:

% room_name | string | random
% type | string | 'single' or 'double'
% beds | integer | 1 to 6
% accessible | boolean | true or false
% image | string | random url
% description | string | random max 20 characters
% features | array[string] | 'Wifi', 'TV' or 'Safe'
% roomPrice | integer | 100 to 200
```

## My Rating

The book provides excellent introductory content on AI-assisted testing, making it valuable for both developers and engineers. The advanced topics covering AI Agents, RAG, and fine-tuning felt somewhat disconnected and could warrant a separate book. Including a concrete example of how traditional Scrum workflows might evolve with prompt engineering[^4] would have enhanced the content.

Despite these minor critiques, it's highly recommended for beginners.

- ⭐⭐⭐⭐ (4/5).

---

## Footnotes

[^3]:
    **Page Object Pattern Resources**  
    Martin Fowler's [definitive article on Page Objects](https://martinfowler.com/bliki/PageObject.html) explains the pattern's core principles and best practices. For practical implementations, the [Playwright Page Object Model](https://playwright.dev/docs/pom) provides official guidance with TypeScript examples and reusable components. Additionally, [WebdriverIO Page Objects](https://webdriver.io/docs/pageobjects/) offers comprehensive implementation guides with modern JavaScript patterns.

[^1]:
    **Property-Based Testing**  
    [fast-check](https://github.com/dubzzz/fast-check) is a property-based testing framework for JavaScript/TypeScript that provides excellent TypeScript support, integrated shrinking capabilities, and built-in async/await support.

[^4]:
    **Prompt Engineering Resources**  
    The [Prompt Engineering Guide](https://www.promptingguide.ai/) offers comprehensive guidance for prompt engineering, including best practices, practical examples, and multi-language support.
