# C:\Users\LENOVO\Team-Grow\config\elasticsearch_config.py

import os
from typing import Dict, Any

class ElasticsearchConfig:
    """Elasticsearch 설정 관리 클래스"""
    
    # 기본 연결 설정
    HOST = os.getenv('ES_HOST', 'localhost')
    PORT = os.getenv('ES_PORT', 9200)
    URL = f"http://{HOST}:{PORT}"
    
    # 인덱스 이름
    PRODUCT_INDEX = 'aller_products'
    USER_INDEX = 'aller_users'
    REVIEW_INDEX = 'aller_reviews'
    
    # 한글 분석기 설정
    KOREAN_ANALYZER = {
        "analyzer": {
            "korean_analyzer": {
                "type": "custom",
                "tokenizer": "nori_tokenizer",
                "filter": [
                    "nori_readingform",
                    "lowercase",
                    "nori_part_of_speech"
                ]
            },
            "korean_search_analyzer": {
                "type": "custom",
                "tokenizer": "nori_tokenizer",
                "filter": [
                    "nori_readingform",
                    "lowercase",
                    "nori_part_of_speech",
                    "synonym_filter"
                ]
            }
        },
        "filter": {
            "synonym_filter": {
                "type": "synonym",
                "synonyms": [
                    "로션, 에멀젼, 수분크림",
                    "선크림, 썬크림, 자외선차단제",
                    "클렌징, 클렌저, 세안제"
                ]
            }
        }
    }
    
    # 인덱스 매핑
    PRODUCT_MAPPING = {
        "properties": {
            "name": {
                "type": "text",
                "analyzer": "korean_analyzer",
                "search_analyzer": "korean_search_analyzer"
            },
            "brand": {
                "type": "keyword",
                "fields": {
                    "text": {
                        "type": "text",
                        "analyzer": "korean_analyzer"
                    }
                }
            },
            "price": {"type": "integer"},
            "ingredients": {
                "type": "keyword",
                "fields": {
                    "text": {
                        "type": "text",
                        "analyzer": "korean_analyzer"
                    }
                }
            },
            "skin_type": {"type": "keyword"},
            "category": {"type": "keyword"},
            "description": {
                "type": "text",
                "analyzer": "korean_analyzer"
            },
            "vector_embedding": {
                "type": "dense_vector",
                "dims": 768  # 벡터 차원
            }
        }
    }