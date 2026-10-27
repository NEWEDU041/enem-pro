"""
ENEM Pro Python SDK
Complete client library for interacting with the ENEM Pro API

Installation:
    pip install enem-pro

Usage:
    from enem_pro import ENEMPro

    client = ENEMPro(api_key="your-api-key")
    questions = client.questions.list(year=2024, discipline="Matemática")
"""

from typing import Optional, Dict, List, Any
from dataclasses import dataclass
import requests
from datetime import datetime


@dataclass
class Question:
    """Represents an ENEM question"""
    id: str
    text: str
    alternatives: List[Dict[str, str]]
    correct_answer: str
    year: int
    discipline: str
    difficulty: str


@dataclass
class ExplanationResponse:
    """AI-generated explanation response"""
    explanation: str
    cached: bool
    cache_source: str
    latency_ms: int


@dataclass
class EssayCorrectionResponse:
    """Essay correction response"""
    score: float
    feedback: str
    suggestions: List[str]
    latency_ms: int


@dataclass
class SimulationResult:
    """Simulation result"""
    simulation_id: str
    score: float
    correct_answers: int
    total_answers: int


class ENEMProSDK:
    """Main SDK client for ENEM Pro API"""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://enem-pro.com/api",
        timeout: int = 30,
    ):
        """
        Initialize ENEM Pro SDK client

        Args:
            api_key: Your API key from the developer dashboard
            base_url: API base URL (default: production)
            timeout: Request timeout in seconds (default: 30)
        """
        self.api_key = api_key
        self.base_url = base_url
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "X-API-Key": api_key,
            "Content-Type": "application/json",
        })

    def _request(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        """Make an API request"""
        url = f"{self.base_url}{path}"
        try:
            response = self.session.request(
                method,
                url,
                timeout=self.timeout,
                **kwargs
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"API request failed: {str(e)}")

    class QuestionsAPI:
        """Questions endpoint"""
        def __init__(self, client: "ENEMProSDK"):
            self.client = client

        def list(
            self,
            year: Optional[int] = None,
            discipline: Optional[str] = None,
            page: int = 1,
            limit: int = 20,
        ) -> Dict[str, Any]:
            """
            List ENEM questions

            Args:
                year: Exam year (e.g., 2024)
                discipline: Subject filter (e.g., 'Matemática')
                page: Pagination page
                limit: Results per page

            Returns:
                Dictionary with questions list and metadata
            """
            params = {
                "page": page,
                "limit": min(limit, 50),
            }
            if year:
                params["year"] = year
            if discipline:
                params["discipline"] = discipline

            return self.client._request("GET", "/questoes", params=params)

        def get(self, question_id: str) -> Question:
            """
            Get a single question by ID

            Args:
                question_id: The question ID

            Returns:
                Question object
            """
            data = self.client._request("GET", f"/questoes/{question_id}")
            return Question(**data)

    class ExplanationsAPI:
        """Explanations endpoint"""
        def __init__(self, client: "ENEMProSDK"):
            self.client = client

        def generate(
            self,
            question_id: str,
            selected_alternative: Optional[str] = None,
        ) -> ExplanationResponse:
            """
            Generate AI explanation for a question

            Args:
                question_id: The question ID
                selected_alternative: Selected answer (A-E)

            Returns:
                ExplanationResponse object
            """
            data = self.client._request(
                "POST",
                "/explicar",
                json={
                    "question_id": question_id,
                    "selected_alternative": selected_alternative,
                },
            )
            return ExplanationResponse(**data)

    class EssaysAPI:
        """Essays endpoint"""
        def __init__(self, client: "ENEMProSDK"):
            self.client = client

        def correct(
            self,
            essay_text: str,
            theme: Optional[str] = None,
        ) -> EssayCorrectionResponse:
            """
            Correct an essay with AI feedback

            Args:
                essay_text: The essay text to correct
                theme: Optional essay theme/topic

            Returns:
                EssayCorrectionResponse object
            """
            data = self.client._request(
                "POST",
                "/corrigir-redacao",
                json={
                    "essay_text": essay_text,
                    "theme": theme,
                },
            )
            return EssayCorrectionResponse(**data)

    class SimulationsAPI:
        """Simulations endpoint"""
        def __init__(self, client: "ENEMProSDK"):
            self.client = client

        def save(
            self,
            answers: Dict[str, str],
            simulation_name: Optional[str] = None,
        ) -> SimulationResult:
            """
            Save a simulation result

            Args:
                answers: Dictionary mapping question IDs to answers
                simulation_name: Optional name for the simulation

            Returns:
                SimulationResult object
            """
            data = self.client._request(
                "POST",
                "/simulado/salvar",
                json={
                    "answers": answers,
                    "simulation_name": simulation_name,
                },
            )
            return SimulationResult(**data)

    class HealthAPI:
        """Health check endpoint"""
        def __init__(self, client: "ENEMProSDK"):
            self.client = client

        def check(self) -> Dict[str, Any]:
            """Check API health status"""
            return self.client._request("GET", "/health")

    def __init__(self, api_key: str, **kwargs):
        """Initialize SDK with endpoints"""
        super().__init__(api_key, **kwargs)
        self.questions = self.QuestionsAPI(self)
        self.explanations = self.ExplanationsAPI(self)
        self.essays = self.EssaysAPI(self)
        self.simulations = self.SimulationsAPI(self)
        self.health = self.HealthAPI(self)


"""
Example Usage:

from enem_pro import ENEMPro

# Initialize client
client = ENEMPro(api_key="sk_live_...")

# List questions
questions = client.questions.list(year=2024, discipline="Matemática", limit=20)
print(f"Found {len(questions['questions'])} questions")

# Get explanation for first question
question_id = questions['questions'][0]['id']
explanation = client.explanations.generate(question_id, "A")
print(f"Explanation: {explanation.explanation}")
print(f"Latency: {explanation.latency_ms}ms")

# Correct an essay
essay_text = "Education is the foundation of society..."
correction = client.essays.correct(essay_text, "The importance of education")
print(f"Score: {correction.score}/10")
print(f"Feedback: {correction.feedback}")

# Save a simulation
answers = {
    question['id']: 'A'
    for question in questions['questions'][:50]
}
result = client.simulations.save(answers, "Morning Practice Session")
print(f"Simulation Score: {result.score}")
print(f"Correct Answers: {result.correct_answers}/{result.total_answers}")

# Health check
health = client.health.check()
print(f"API Status: {health['status']}")
"""
