-- companies テーブルに selection_schedule カラムを追加
-- AIが自動収集した選考日程（JSON文字列）を格納
alter table companies
  add column if not exists selection_schedule text;
