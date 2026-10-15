// These should match the link_type ENUM in the database (src/database/tables/urls.sql)
export type LinkType =
  | "classic"
  | "custom"
  | "affix" // custom code on a username
  | "ultra"
  | "digit"
  | "qr";