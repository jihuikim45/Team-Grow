import { API_BASE } from '@/lib/env';
import { Ingredient } from '../model/types';

export interface IngredientSearchResponse {
  items: Ingredient[];
  nextPage: number | null;
  hasMore: boolean;
  total: number;
}

export const ingredientApi = {
  /**
   * 성분 검색 (페이지 기반 페이지네이션)
   */
  async search(
    query: string,
    size: number = 20,
    page: number = 1
  ): Promise<IngredientSearchResponse> {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      size: String(size),
    });

    const response = await fetch(`${API_BASE}/search/ingredients?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to search ingredients');
    }

    const data = await response.json();
    const { results, total, page: currentPage, size: pageSize } = data;

    const hasMore = currentPage * pageSize < total;

    return {
      items: results,
      nextPage: hasMore ? currentPage + 1 : null,
      hasMore,
      total,
    };
  },

  /**
   * 전체 성분 목록 조회 - 하위 호환성을 위해 유지
   * 새 코드에서는 search() 사용 권장
   * @deprecated
   */
  async fetchAll(limit: number = 5000): Promise<Ingredient[]> {
    console.warn('ingredientApi.fetchAll is deprecated. Use search() instead.');
    const response = await fetch(`${API_BASE}/ingredients/list_all?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch ingredients');
    }
    const raw = await response.json();
    return (raw || [])
      .map((r: any) => ({
        id: Number(r.id),
        korean_name: r.korean_name,
        english_name: r.english_name ?? null,
        description: r.description ?? null,
        caution_grade: r.caution_grade ?? r.caution ?? r.caution_g ?? null,
      }))
      .filter((x: Ingredient) => x.id && x.korean_name);
  },
};
