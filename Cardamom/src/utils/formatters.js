export const formatRs = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const formatKg = (value) => `${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })} kg`;
