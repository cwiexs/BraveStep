const [form, setForm] = useState({
  name: '',
  email: '',
  goal: '',
  phone: '',
  dateOfBirth: '',
  city: ''
});

// Užkrauna vartotojo info
useEffect(() => {
  if (status === 'authenticated') {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setForm({
          name: data.name || '',
          email: data.email || '',
          goal: data.goal || '',
          phone: data.phone || '',
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.substring(0, 10) : '', // tik data, be laiko
          city: data.city || ''
        });
      });
  }
}, [status]);

// ...

<FieldRow label={t('name')}        type="text"  field="name"        />
<FieldRow label={t('email')}       type="email" field="email"       disabled />
<FieldRow label={t('goal')}        type="text"  field="goal"        />
<FieldRow label={t('phone')}       type="text"  field="phone"       />
<FieldRow label={t('dateOfBirth')} type="date"  field="dateOfBirth" />
<FieldRow label={t('city')}        type="text"  field="city"        />
