import { authenticatedFetch } from "./authApi";

async function getTrainingCategories() {
  return authenticatedFetch(
    "/training/categories"
  );
}

async function getTrainingQuestions(
  categoryId,
  limit = 5
) {
  return authenticatedFetch(
    `/training/questions?categoryId=${categoryId}&limit=${limit}`
  );
}

async function createTrainingSession(
  categoryId,
  limit = 5,
  difficulty = null
) {
  return authenticatedFetch(
    "/training/sessions",
    {
      method: "POST",
      body: JSON.stringify({
        categoryId,
        limit,
        difficulty
      })
    }
  );
}

async function submitTrainingAnswer(
  sessionId,
  formData
) {
  return authenticatedFetch(
    `/training/sessions/${sessionId}/answers`,
    {
      method: "POST",
      body: formData
    }
  );
}

async function completeTrainingSession(
  sessionId
) {
  return authenticatedFetch(
    `/training/sessions/${sessionId}/complete`,
    {
      method: "POST"
    }
  );
}

export {
  getTrainingCategories,
  getTrainingQuestions,
  createTrainingSession,
  submitTrainingAnswer,
  completeTrainingSession
};