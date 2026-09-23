import React from 'react';

function FormatDate({ value }) {
  if (!value) return <>-</>;

  const formattedDate = String(value)
    .split('T')[0]
    .split('-')
    .reverse()
    .join('/');

  return <>{formattedDate}</>;
}

export default FormatDate;