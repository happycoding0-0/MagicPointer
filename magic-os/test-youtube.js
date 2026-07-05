const test = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/youtube?q=iu');
    const data = await response.json();
    console.log("RESULT:", data);
  } catch (e) {
    console.error("ERROR:", e);
  }
};
test();
