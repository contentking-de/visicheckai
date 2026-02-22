export type ChecklistItem = {
  key: string;
  labelKey: string;
};

export type ChecklistCategory = {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  items: ChecklistItem[];
};

export const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  {
    id: "tech",
    titleKey: "cat_tech",
    descriptionKey: "cat_tech_desc",
    items: [
      { key: "tech.sitemap", labelKey: "tech_sitemap" },
      { key: "tech.robots", labelKey: "tech_robots" },
      { key: "tech.url_structure", labelKey: "tech_url_structure" },
      { key: "tech.canonicals", labelKey: "tech_canonicals" },
      { key: "tech.mobile_cwv", labelKey: "tech_mobile_cwv" },
      { key: "tech.schema_organization", labelKey: "tech_schema_organization" },
      { key: "tech.schema_person", labelKey: "tech_schema_person" },
      { key: "tech.schema_product", labelKey: "tech_schema_product" },
      { key: "tech.schema_service", labelKey: "tech_schema_service" },
      { key: "tech.schema_faq", labelKey: "tech_schema_faq" },
      { key: "tech.schema_howto", labelKey: "tech_schema_howto" },
      { key: "tech.schema_article", labelKey: "tech_schema_article" },
      { key: "tech.schema_review", labelKey: "tech_schema_review" },
      { key: "tech.schema_breadcrumb", labelKey: "tech_schema_breadcrumb" },
    ],
  },
  {
    id: "entity",
    titleKey: "cat_entity",
    descriptionKey: "cat_entity_desc",
    items: [
      { key: "entity.knowledge_page", labelKey: "entity_knowledge_page" },
      { key: "entity.brand_claim", labelKey: "entity_brand_claim" },
      { key: "entity.brand_spelling", labelKey: "entity_brand_spelling" },
      { key: "entity.brand_definition", labelKey: "entity_brand_definition" },
      { key: "entity.wikidata", labelKey: "entity_wikidata" },
      { key: "entity.wikipedia", labelKey: "entity_wikipedia" },
      { key: "entity.knowledge_panel", labelKey: "entity_knowledge_panel" },
      { key: "entity.directories", labelKey: "entity_directories" },
      { key: "entity.nap", labelKey: "entity_nap" },
    ],
  },
  {
    id: "content",
    titleKey: "cat_content",
    descriptionKey: "cat_content_desc",
    items: [
      { key: "content.h2h3_questions", labelKey: "content_h2h3_questions" },
      { key: "content.definitions", labelKey: "content_definitions" },
      { key: "content.bulletpoints", labelKey: "content_bulletpoints" },
      { key: "content.tables", labelKey: "content_tables" },
      { key: "content.step_by_step", labelKey: "content_step_by_step" },
      { key: "content.comparison", labelKey: "content_comparison" },
      { key: "content.best_tools", labelKey: "content_best_tools" },
      { key: "content.alternatives", labelKey: "content_alternatives" },
      { key: "content.author_profiles", labelKey: "content_author_profiles" },
      { key: "content.linkedin", labelKey: "content_linkedin" },
      { key: "content.sources", labelKey: "content_sources" },
      { key: "content.case_studies", labelKey: "content_case_studies" },
      { key: "content.studies_data", labelKey: "content_studies_data" },
    ],
  },
  {
    id: "pr",
    titleKey: "cat_pr",
    descriptionKey: "cat_pr_desc",
    items: [
      { key: "pr.guest_articles", labelKey: "pr_guest_articles" },
      { key: "pr.interviews", labelKey: "pr_interviews" },
      { key: "pr.publish_studies", labelKey: "pr_publish_studies" },
      { key: "pr.whitepapers", labelKey: "pr_whitepapers" },
      { key: "pr.industry_rankings", labelKey: "pr_industry_rankings" },
      { key: "pr.press_releases", labelKey: "pr_press_releases" },
      { key: "pr.strong_domain_mentions", labelKey: "pr_strong_domain_mentions" },
    ],
  },
  {
    id: "platform",
    titleKey: "cat_platform",
    descriptionKey: "cat_platform_desc",
    items: [
      { key: "platform.youtube", labelKey: "platform_youtube" },
      { key: "platform.linkedin", labelKey: "platform_linkedin" },
      { key: "platform.medium", labelKey: "platform_medium" },
      { key: "platform.reddit", labelKey: "platform_reddit" },
      { key: "platform.quora", labelKey: "platform_quora" },
      { key: "platform.github", labelKey: "platform_github" },
      { key: "platform.product_hunt", labelKey: "platform_product_hunt" },
      { key: "platform.crunchbase", labelKey: "platform_crunchbase" },
      { key: "platform.consistent_branding", labelKey: "platform_consistent_branding" },
      { key: "platform.keyword_bio", labelKey: "platform_keyword_bio" },
      { key: "platform.thought_leadership", labelKey: "platform_thought_leadership" },
      { key: "platform.quality_comments", labelKey: "platform_quality_comments" },
    ],
  },
  {
    id: "faq",
    titleKey: "cat_faq",
    descriptionKey: "cat_faq_desc",
    items: [
      { key: "faq.faq_page", labelKey: "faq_faq_page" },
      { key: "faq.answer_user_questions", labelKey: "faq_answer_user_questions" },
      { key: "faq.subpages", labelKey: "faq_subpages" },
      { key: "faq.what_is", labelKey: "faq_what_is" },
      { key: "faq.how_does", labelKey: "faq_how_does" },
      { key: "faq.why_should", labelKey: "faq_why_should" },
    ],
  },
  {
    id: "authority",
    titleKey: "cat_authority",
    descriptionKey: "cat_authority_desc",
    items: [
      { key: "authority.quality_backlinks", labelKey: "authority_quality_backlinks" },
      { key: "authority.no_spam", labelKey: "authority_no_spam" },
      { key: "authority.mentions_over_links", labelKey: "authority_mentions_over_links" },
      { key: "authority.newsletter", labelKey: "authority_newsletter" },
      { key: "authority.social_media", labelKey: "authority_social_media" },
      { key: "authority.podcast", labelKey: "authority_podcast" },
      { key: "authority.webinars", labelKey: "authority_webinars" },
      { key: "authority.ads", labelKey: "authority_ads" },
    ],
  },
  {
    id: "data",
    titleKey: "cat_data",
    descriptionKey: "cat_data_desc",
    items: [
      { key: "data.surveys", labelKey: "data_surveys" },
      { key: "data.industry_report", labelKey: "data_industry_report" },
      { key: "data.regular_updates", labelKey: "data_regular_updates" },
      { key: "data.press_distribution", labelKey: "data_press_distribution" },
    ],
  },
  {
    id: "conversational",
    titleKey: "cat_conversational",
    descriptionKey: "cat_conversational_desc",
    items: [
      { key: "conversational.long_tail", labelKey: "conversational_long_tail" },
      { key: "conversational.decision_trees", labelKey: "conversational_decision_trees" },
      { key: "conversational.use_case_pages", labelKey: "conversational_use_case_pages" },
      { key: "conversational.recommendations", labelKey: "conversational_recommendations" },
    ],
  },
  {
    id: "monitoring",
    titleKey: "cat_monitoring",
    descriptionKey: "cat_monitoring_desc",
    items: [
      { key: "monitoring.chatgpt", labelKey: "monitoring_chatgpt" },
      { key: "monitoring.perplexity", labelKey: "monitoring_perplexity" },
      { key: "monitoring.gemini", labelKey: "monitoring_gemini" },
      { key: "monitoring.claude", labelKey: "monitoring_claude" },
      { key: "monitoring.bing_copilot", labelKey: "monitoring_bing_copilot" },
      { key: "monitoring.check_mentions", labelKey: "monitoring_check_mentions" },
      { key: "monitoring.check_links", labelKey: "monitoring_check_links" },
      { key: "monitoring.check_context", labelKey: "monitoring_check_context" },
      { key: "monitoring.adapt_content", labelKey: "monitoring_adapt_content" },
    ],
  },
  {
    id: "link_structure",
    titleKey: "cat_link_structure",
    descriptionKey: "cat_link_structure_desc",
    items: [
      { key: "link_structure.landing_pages", labelKey: "link_structure_landing_pages" },
      { key: "link_structure.no_marketing_blabla", labelKey: "link_structure_no_marketing_blabla" },
      { key: "link_structure.facts_value", labelKey: "link_structure_facts_value" },
      { key: "link_structure.internal_linking", labelKey: "link_structure_internal_linking" },
    ],
  },
  {
    id: "llm_tech",
    titleKey: "cat_llm_tech",
    descriptionKey: "cat_llm_tech_desc",
    items: [
      { key: "llm_tech.no_paywall", labelKey: "llm_tech_no_paywall" },
      { key: "llm_tech.no_aggressive_js", labelKey: "llm_tech_no_aggressive_js" },
      { key: "llm_tech.fast_loading", labelKey: "llm_tech_fast_loading" },
      { key: "llm_tech.clear_html", labelKey: "llm_tech_clear_html" },
      { key: "llm_tech.structured_headings", labelKey: "llm_tech_structured_headings" },
    ],
  },
  {
    id: "trust",
    titleKey: "cat_trust",
    descriptionKey: "cat_trust_desc",
    items: [
      { key: "trust.reviews", labelKey: "trust_reviews" },
      { key: "trust.testimonials", labelKey: "trust_testimonials" },
      { key: "trust.case_studies", labelKey: "trust_case_studies" },
      { key: "trust.client_logos", labelKey: "trust_client_logos" },
      { key: "trust.certificates", labelKey: "trust_certificates" },
      { key: "trust.press_area", labelKey: "trust_press_area" },
      { key: "trust.imprint", labelKey: "trust_imprint" },
    ],
  },
];

export function getAllItemKeys(): string[] {
  return CHECKLIST_CATEGORIES.flatMap((cat) => cat.items.map((item) => item.key));
}

export function getTotalItemCount(): number {
  return CHECKLIST_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);
}
