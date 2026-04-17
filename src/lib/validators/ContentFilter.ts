import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

export interface ContentCheckResult {
  clean: boolean;
}

export class ContentFilter {
  private matcher: RegExpMatcher;

  constructor() {
    this.matcher = new RegExpMatcher({
      ...englishDataset.build(),
      ...englishRecommendedTransformers,
    });
  }

  check(text: string): ContentCheckResult {
    if (!text) return { clean: true };
    return { clean: !this.matcher.hasMatch(text) };
  }

  checkMultiple(texts: string[]): ContentCheckResult {
    for (const text of texts) {
      if (!this.check(text).clean) return { clean: false };
    }
    return { clean: true };
  }
}