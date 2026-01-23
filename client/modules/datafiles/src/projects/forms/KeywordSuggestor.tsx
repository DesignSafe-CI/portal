// KeywordSuggestor.tsx
import React, { useMemo } from 'react';
import { Form, Tag, Spin } from 'antd';
import type { FormInstance } from 'antd';
import { useDebounceValue, useKeywordSuggestions } from '@client/hooks';

type Props = {
  form: FormInstance;
  titlePath: (string | number)[];
  descriptionPath: (string | number)[];
  hazardTypesPath: (string | number)[];
  keywordsPath: (string | number)[];
};

export const KeywordSuggestor: React.FC<Props> = ({
  form,
  titlePath,
  descriptionPath,
  hazardTypesPath,
  keywordsPath,
}) => {
  const title: string = Form.useWatch(titlePath, form) ?? '';
  const description: string = Form.useWatch(descriptionPath, form) ?? '';
  const hazard_types: {id: string, name: string}[] = Form.useWatch(hazardTypesPath, form) ?? '';
  const keywords: string[] = Form.useWatch(keywordsPath, form) ?? [];

  const debounced = useDebounceValue(
    { title: title.trim(), description: description.trim(), hazard_types: Object.values(hazard_types).map((hazard_type) => hazard_type.name) },
    800
  );

  const {
    data: suggestions = [],
    isLoading,
    isFetching,
    error,
  } = useKeywordSuggestions(debounced);

  const available = useMemo(
    () => suggestions.filter((kw) => !keywords.includes(kw)),
    [suggestions, keywords]
  );

  const hasText =
    debounced.title.length > 0 && debounced.description.length > 0 && debounced.hazard_types.length > 0;

  if (!hasText) {
    return (
      <div style={{ marginTop: 8 }}>
        <span>Suggested Keywords: </span>
        <em style={{ color: 'rgba(0,0,0,.45)' }}>
          Enter a project <strong>title</strong> and{' '}
          <strong>description</strong> to see keyword suggestions.
        </em>
      </div>
    );
  }

  if (error) return null;

  const list = available.slice(0, 10);
  const loading = isLoading || isFetching;

  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ marginBottom: 6 }}>Suggested Keywords:</p>

      {/* While loading and nothing cached yet, show a friendly status instead of an empty area */}
      {loading && list.length === 0 ? (
        <div
          aria-live="polite"
          style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}
        >
          <Spin size="small" />
          <em style={{ color: 'rgba(0,0,0,.45)' }}>Finding suggestions…</em>
        </div>
      ) : list.length === 0 ? (
        <em style={{ color: 'rgba(0,0,0,.45)' }}>No suggestions yet.</em>
      ) : (
        list.map((kw) => (
          <Tag
            key={kw}
            color="blue"
            style={{ cursor: 'pointer', marginBottom: 4 }}
            onClick={() => {
              const current: string[] = form.getFieldValue(keywordsPath) || [];
              if (!current.includes(kw)) {
                form.setFieldValue(keywordsPath, [...current, kw]);
              }
            }}
          >
            {kw}
          </Tag>
        ))
      )}
    </div>
  );
};
