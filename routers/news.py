"""
NewsAPI Intelligence Router for SentinelX
=========================================
Real-time media intelligence, IMD press bulletins, and heatwave threat scoring.
"""

import os
import time
import threading
import requests
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/api/v1/news", tags=["News & Media Intelligence"])

NEWS_API_KEY = os.environ.get("NEWS_API_KEY", "ae6b26e8512d4fb8a6d5a917923908f6")

_news_cache = {"last_updated": 0, "articles": [], "query": ""}
_news_cache_lock = threading.Lock()

def get_news_threat_tag(title: str, description: str):
    text = (str(title) + " " + str(description)).lower()
    if any(w in text for w in ["death", "fatal", "severe heatwave", "red alert", "emergency", "crisis", "casualties"]):
        return {"level": "CRITICAL ALERT", "color": "#ef4444", "priority": 1}
    if any(w in text for w in ["heatwave", "orange alert", "sunstroke", "hospital surge", "warning", "heat stroke"]):
        return {"level": "HEATWAVE WARNING", "color": "#f97316", "priority": 2}
    if any(w in text for w in ["advisory", "yellow alert", "imd", "osdma", "heavy rain", "monsoon", "thunderstorm"]):
        return {"level": "IMD ADVISORY", "color": "#eab308", "priority": 3}
    return {"level": "CLIMATE INTEL", "color": "#38bdf8", "priority": 4}

def fetch_live_news(query: Optional[str] = None, page_size: int = 15, force_refresh: bool = False):
    global _news_cache
    now = time.time()
    q = query or 'heatwave OR "extreme heat" OR "IMD" OR "sunstroke" OR "weather alert" OR "OSDMA" OR "heavy rain"'
    
    with _news_cache_lock:
        if not force_refresh and _news_cache["articles"] and (now - _news_cache["last_updated"] < 600) and (_news_cache["query"] == q):
            return _news_cache["articles"]
    
    try:
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": q,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": min(page_size, 25),
            "apiKey": NEWS_API_KEY
        }
        resp = requests.get(url, params=params, timeout=12)
        if resp.status_code == 200:
            data = resp.json()
            raw_articles = data.get("articles", [])
            processed = []
            for art in raw_articles:
                title = art.get("title") or ""
                desc = art.get("description") or ""
                if "[Removed]" in title or not title:
                    continue
                tag = get_news_threat_tag(title, desc)
                processed.append({
                    "title": title,
                    "description": desc,
                    "source": art.get("source", {}).get("name", "News Network"),
                    "author": art.get("author") or "Agency",
                    "url": art.get("url"),
                    "image_url": art.get("urlToImage"),
                    "published_at": art.get("publishedAt"),
                    "threat_level": tag["level"],
                    "threat_color": tag["color"],
                    "priority": tag["priority"]
                })
            
            with _news_cache_lock:
                _news_cache = {
                    "last_updated": now,
                    "articles": processed,
                    "query": q
                }
            return processed
    except Exception as e:
        print(f"[NewsAPI] Fetch error: {e}")
    
    with _news_cache_lock:
        return _news_cache.get("articles", [])


@router.get("", summary="Get real-time weather & heatwave news articles")
@router.get("/heatwave", summary="Get heatwave, sunstroke & extreme weather news")
@router.get("/live", summary="Alias for live news feed")
def get_heatwave_news(
    q: Optional[str] = Query(None, description="Custom search query"),
    refresh: bool = Query(False, description="Force refresh cache"),
    limit: int = Query(15, ge=1, le=50, description="Max articles to return")
):
    articles = fetch_live_news(query=q, page_size=limit, force_refresh=refresh)
    return {
        "status": "ok",
        "total_articles": len(articles),
        "source": "NewsAPI.org Live Feed",
        "threat_breakdown": {
            "critical": sum(1 for a in articles if a["threat_level"] == "CRITICAL ALERT"),
            "warning": sum(1 for a in articles if a["threat_level"] == "HEATWAVE WARNING"),
            "advisory": sum(1 for a in articles if a["threat_level"] == "IMD ADVISORY"),
            "intel": sum(1 for a in articles if a["threat_level"] == "CLIMATE INTEL")
        },
        "articles": articles
    }


@router.get("/odisha", summary="Get Odisha regional weather & IMD bulletins")
def get_odisha_news(limit: int = Query(10, ge=1, le=30)):
    odisha_q = '(Odisha OR Bhubaneswar OR Cuttack OR "Bay of Bengal") AND (weather OR rain OR heat OR IMD)'
    articles = fetch_live_news(query=odisha_q, page_size=limit)
    return {
        "status": "ok",
        "region": "Odisha & Eastern India",
        "total_articles": len(articles),
        "articles": articles
    }
