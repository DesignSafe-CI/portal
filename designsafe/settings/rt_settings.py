import os

DJANGO_RT = {
    "RT_HOST": os.environ.get("RT_HOST", "https://rt.example.com/REST/1.0"),
    "RT_UN": os.environ.get("RT_USERNAME", "username"),
    "RT_PW": os.environ.get("RT_PASSWORD", "password"),
    "RT_QUEUE": os.environ.get("RT_DEFAULT_QUEUE", "Support"),
    "RT_FEEDBACK_QUEUE": os.environ.get("RT_FEEDBACK_QUEUE", "Designsafe-pub-feedback"),
}

TICKET_CATEGORIES = (
    ("DATA_CURATION_PUBLICATION", "Data Curation & Publication"),
    ("DATA_DEPOT", "Data Depot"),
    ("TOOLS_APPS", "Tools & Applications"),
    ("LOGIN", "Login/Registration"),
    ("OTHER", "Other"),
)
