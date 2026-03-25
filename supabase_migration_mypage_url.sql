-- companies テーブルに mypage_url カラムを追加
-- 就活サービス（リクナビ・マイナビ等）のマイページURLを別途管理するため
alter table companies
  add column if not exists mypage_url text;
