export default function LSFormError({ error }) {
  return error ? <div style={{ color: 'red' }}>{error}</div> : null;
}
