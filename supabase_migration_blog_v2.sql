-- blog_posts テーブルに focus_keyphrase カラムを追加
alter table blog_posts
  add column if not exists focus_keyphrase text;
