import os
#from .openai_client import ask_openai
from .groq_client import ask_groq

DEFAULT_PROVIDER = os.getenv("DEFAULT_LLM", "openai")

def ask_llm(system_prompt: str, user_prompt: str) -> str:
    if DEFAULT_PROVIDER == "groq":
        return ask_groq(system_prompt, user_prompt)

    #return ask_openai(system_prompt, user_prompt)
