# services/search_ingredients.py

from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Query, Depends, HTTPException
from pydantic import BaseModel
from elasticsearch import Elasticsearch

from services.es_client import get_es_client


INDEX_NAME = "ingredients"

router = APIRouter(
    prefix="/search",
    tags=["ingredients-search"],
)


class IngredientHit(BaseModel):
    id: Optional[int] = None
    korean_name: Optional[str] = None
    english_name: Optional[str] = None
    description: Optional[str] = None
    caution_grade: Optional[str] = None
    score: Optional[float] = None
    highlight: Dict[str, List[str]] = {}


class IngredientSearchResponse(BaseModel):
    total: int
    page: int
    size: int
    results: List[IngredientHit]


@router.get("/ingredients", response_model=IngredientSearchResponse)
async def search_ingredients(
    q: str = Query(..., description="검색어"),
    page: int = Query(1, ge=1, description="페이지 번호 (1부터 시작)"),
    size: int = Query(10, ge=1, le=100, description="페이지당 문서 수"),
    es: Elasticsearch = Depends(get_es_client),
):
    """
    - caution_grade = '안전' 문서 가중치 ↑
    - 오타 허용 (fuzziness=AUTO)
    - 하이라이팅
    - 페이지네이션
    """
    if not q.strip():
        raise HTTPException(status_code=400, detail="검색어(q)는 비워둘 수 없습니다.")

    body: Dict[str, Any] = {
        "from": (page - 1) * size,
        "size": size,
        "query": {
            "function_score": {
                "query": {
                    "bool": {
                        "should": [
                            # 1) Prefix 매칭 (자동완성) - 가장 높은 가중치
                            {
                                "match_phrase_prefix": {
                                    "korean_name": {
                                        "query": q,
                                        "boost": 10
                                    }
                                }
                            },
                            {
                                "match_phrase_prefix": {
                                    "english_name": {
                                        "query": q,
                                        "boost": 8
                                    }
                                }
                            },
                            # 2) 초성 검색 ("ㄴㅇㅅ" -> "나이아신...")
                            {
                                "match_phrase_prefix": {
                                    "korean_name_chosung": {
                                        "query": q,
                                        "boost": 9
                                    }
                                }
                            },
                            # 3) 일반 매칭 (중간에 포함된 경우)
                            {
                                "multi_match": {
                                    "query": q,
                                    "fields": [
                                        "korean_name^3",
                                        "english_name^2",
                                        "description",
                                    ],
                                    "type": "best_fields",
                                    "fuzziness": "AUTO",
                                }
                            },
                        ],
                        "minimum_should_match": 1
                    }
                },
                "functions": [
                    {
                        "filter": {"term": {"caution_grade": "안전"}},
                        "weight": 2.0,
                    }
                ],
                "score_mode": "sum",
                "boost_mode": "sum",
            }
        },
        "highlight": {
            "pre_tags": ["<em>"],
            "post_tags": ["</em>"],
            "fields": {
                "korean_name": {},
                "english_name": {},
                "description": {},
            },
        },
    }

    try:
        resp = es.search(index=INDEX_NAME, body=body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Elasticsearch 검색 오류: {e}")

    hits_block = resp.get("hits", {})
    total = hits_block.get("total", {}).get("value", 0)

    results: List[IngredientHit] = []
    for hit in hits_block.get("hits", []):
        source = hit.get("_source", {}) or {}
        highlight = hit.get("highlight", {}) or {}

        item = IngredientHit(
            id=source.get("id"),
            korean_name=source.get("korean_name"),
            english_name=source.get("english_name"),
            description=source.get("description"),
            caution_grade=source.get("caution_grade"),
            score=hit.get("_score"),
            highlight=highlight,
        )
        results.append(item)

    return IngredientSearchResponse(
        total=total,
        page=page,
        size=size,
        results=results,
    )
