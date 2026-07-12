
const check = async () => {
  try {
    console.log('Pinging http://127.0.0.1:5000/api/health...');
    const healthRes = await fetch('http://127.0.0.1:5000/api/health');
    const healthJson = await healthRes.json();
    console.log('Health response status:', healthRes.status);
    console.log('Health response body:', healthJson);

    console.log('\nPinging http://127.0.0.1:5000/api/trainer/trainers...');
    const res = await fetch('http://127.0.0.1:5000/api/trainer/trainers');
    console.log('Trainers response status:', res.status);
    console.log('Trainers response Content-Type:', res.headers.get('content-type'));
    const bodyText = await res.text();
    console.log('Trainers response body snippet:', bodyText.slice(0, 300));
  } catch (error) {
    console.log('Error:', error.message);
  }
};

check();
