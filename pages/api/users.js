// pages/api/users.js
import { getToken } from 'next-auth/jwt';
import { query } from '../../lib/db';

export default async function handler(req, res) {
  // Patikrinam prisijungimą naudojant JWT tokeną
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return res.status(401).json({ error: 'Neautorizuota' });
  }

  const email = token.email;

  // GET – paima prisijungusio vartotojo duomenis
  if (req.method === 'GET') {
    try {
      const result = await query(
        `SELECT * FROM users WHERE email = $1 LIMIT 1;`,
        [email]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vartotojas nerastas' });
      }
      // Adapteris masyvinėms reikšmėms (jei reikia)
      const user = result.rows[0];
      // Saugumui išimti slaptažodį
      delete user.password;
      res.status(200).json(user);
    } catch (error) {
      console.error('TIKROJI KLAIDA:', error.message);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  // PUT – atnaujina visus profilio laukus
  if (req.method === 'PUT') {
    try {
      // Čia surašyk VISUS laukus, kuriuos MyProfile leidžia redaguoti
      const {
        name, phone, preferredLanguage, dateOfBirth, gender, city, country, profilePhotoUrl,
        heightCm, weightKg, bodyType, fitnessLevel, healthConditions, allergies, foodRestrictions,
        medications, hasInsurance, smokes, alcohol, stressLevel, familyStatus, mealsPerDay,
        eatsOutOften, dietType, favoriteFoods, dislikedFoods, cuisinePreference, supplements,
        eatingHabits, coffeePerDay, teaPerDay, sugarPerDay, jobType, workHoursPerDay, workSchedule,
        wakeUpTime, bedTime, sleepHours, goalDeadline, notifications, motivationLevel, mainObstacles,
        successDefinition, previousFitnessExperience, goal, physicalActivityLevel, stepsPerDay,
        favoriteActivities, currentSports, newActivitiesInterest, minutesPerWorkout, workoutsPerWeek,
        workoutLocation, equipmentAvailable, accessLevel
      } = req.body;

      // Sukuriam sąrašą ką update'inti ir su kokiom reikšmėm
      const fields = [];
      const values = [];
      let idx = 1;

      // Visi paprasti laukai
      if (name !== undefined)                   { fields.push(`name = $${idx++}`); values.push(name); }
      if (phone !== undefined)                  { fields.push(`phone = $${idx++}`); values.push(phone); }
      if (preferredLanguage !== undefined)      { fields.push(`"preferredLanguage" = $${idx++}`); values.push(preferredLanguage); }
      if (dateOfBirth !== undefined)            { fields.push(`"dateOfBirth" = $${idx++}`); values.push(dateOfBirth); }
      if (gender !== undefined)                 { fields.push(`gender = $${idx++}`); values.push(gender); }
      if (city !== undefined)                   { fields.push(`city = $${idx++}`); values.push(city); }
      if (country !== undefined)                { fields.push(`country = $${idx++}`); values.push(country); }
      if (profilePhotoUrl !== undefined)        { fields.push(`"profilePhotoUrl" = $${idx++}`); values.push(profilePhotoUrl); }
      if (heightCm !== undefined)               { fields.push(`"heightCm" = $${idx++}`); values.push(heightCm); }
      if (weightKg !== undefined)               { fields.push(`"weightKg" = $${idx++}`); values.push(weightKg); }
      if (bodyType !== undefined)               { fields.push(`"bodyType" = $${idx++}`); values.push(bodyType); }
      if (fitnessLevel !== undefined)           { fields.push(`"fitnessLevel" = $${idx++}`); values.push(fitnessLevel); }
      if (healthConditions !== undefined)       { fields.push(`"healthConditions" = $${idx++}`); values.push(healthConditions); }
      if (allergies !== undefined)              { fields.push(`allergies = $${idx++}`); values.push(allergies); }
      if (foodRestrictions !== undefined)       { fields.push(`"foodRestrictions" = $${idx++}`); values.push(foodRestrictions); }
      if (medications !== undefined)            { fields.push(`medications = $${idx++}`); values.push(medications); }
      if (hasInsurance !== undefined)           { fields.push(`"hasInsurance" = $${idx++}`); values.push(hasInsurance); }
      if (smokes !== undefined)                 { fields.push(`smokes = $${idx++}`); values.push(smokes); }
      if (alcohol !== undefined)                { fields.push(`alcohol = $${idx++}`); values.push(alcohol); }
      if (stressLevel !== undefined)            { fields.push(`"stressLevel" = $${idx++}`); values.push(stressLevel); }
      if (familyStatus !== undefined)           { fields.push(`"familyStatus" = $${idx++}`); values.push(familyStatus); }
      if (mealsPerDay !== undefined)            { fields.push(`"mealsPerDay" = $${idx++}`); values.push(mealsPerDay); }
      if (eatsOutOften !== undefined)           { fields.push(`"eatsOutOften" = $${idx++}`); values.push(eatsOutOften); }
      if (dietType !== undefined)               { fields.push(`"dietType" = $${idx++}`); values.push(dietType); }
      if (favoriteFoods !== undefined)          { fields.push(`"favoriteFoods" = $${idx++}`); values.push(favoriteFoods); }
      if (dislikedFoods !== undefined)          { fields.push(`"dislikedFoods" = $${idx++}`); values.push(dislikedFoods); }
      if (cuisinePreference !== undefined)      { fields.push(`"cuisinePreference" = $${idx++}`); values.push(cuisinePreference); }
      if (supplements !== undefined)            { fields.push(`supplements = $${idx++}`); values.push(supplements); }
      if (eatingHabits !== undefined)           { fields.push(`"eatingHabits" = $${idx++}`); values.push(eatingHabits); }
      if (coffeePerDay !== undefined)           { fields.push(`"coffeePerDay" = $${idx++}`); values.push(coffeePerDay); }
      if (teaPerDay !== undefined)              { fields.push(`"teaPerDay" = $${idx++}`); values.push(teaPerDay); }
      if (sugarPerDay !== undefined)            { fields.push(`"sugarPerDay" = $${idx++}`); values.push(sugarPerDay); }
      if (jobType !== undefined)                { fields.push(`"jobType" = $${idx++}`); values.push(jobType); }
      if (workHoursPerDay !== undefined)        { fields.push(`"workHoursPerDay" = $${idx++}`); values.push(workHoursPerDay); }
      if (workSchedule !== undefined)           { fields.push(`"workSchedule" = $${idx++}`); values.push(workSchedule); }
      if (wakeUpTime !== undefined)             { fields.push(`"wakeUpTime" = $${idx++}`); values.push(wakeUpTime); }
      if (bedTime !== undefined)                { fields.push(`"bedTime" = $${idx++}`); values.push(bedTime); }
      if (sleepHours !== undefined)             { fields.push(`"sleepHours" = $${idx++}`); values.push(sleepHours); }
      if (goalDeadline !== undefined)           { fields.push(`"goalDeadline" = $${idx++}`); values.push(goalDeadline); }
      if (notifications !== undefined)          { fields.push(`notifications = $${idx++}`); values.push(notifications); }
      if (motivationLevel !== undefined)        { fields.push(`"motivationLevel" = $${idx++}`); values.push(motivationLevel); }
      if (mainObstacles !== undefined)          { fields.push(`"mainObstacles" = $${idx++}`); values.push(mainObstacles); }
      if (successDefinition !== undefined)      { fields.push(`"successDefinition" = $${idx++}`); values.push(successDefinition); }
      if (previousFitnessExperience !== undefined) { fields.push(`"previousFitnessExperience" = $${idx++}`); values.push(previousFitnessExperience); }
      if (goal !== undefined)                   { fields.push(`goal = $${idx++}`); values.push(goal); }
      if (physicalActivityLevel !== undefined)  { fields.push(`"physicalActivityLevel" = $${idx++}`); values.push(physicalActivityLevel); }
      if (stepsPerDay !== undefined)            { fields.push(`"stepsPerDay" = $${idx++}`); values.push(stepsPerDay); }
      if (favoriteActivities !== undefined)     { fields.push(`"favoriteActivities" = $${idx++}`); values.push(favoriteActivities); }
      if (currentSports !== undefined)          { fields.push(`"currentSports" = $${idx++}`); values.push(currentSports); }
      if (newActivitiesInterest !== undefined)  { fields.push(`"newActivitiesInterest" = $${idx++}`); values.push(newActivitiesInterest); }
      if (minutesPerWorkout !== undefined)      { fields.push(`"minutesPerWorkout" = $${idx++}`); values.push(minutesPerWorkout); }
      if (workoutsPerWeek !== undefined)        { fields.push(`"workoutsPerWeek" = $${idx++}`); values.push(workoutsPerWeek); }
      if (workoutLocation !== undefined)        { fields.push(`"workoutLocation" = $${idx++}`); values.push(workoutLocation); }
      if (equipmentAvailable !== undefined)     { fields.push(`"equipmentAvailable" = $${idx++}`); values.push(equipmentAvailable); }
      if (accessLevel !== undefined)            { fields.push(`"accessLevel" = $${idx++}`); values.push(accessLevel); }

      // Neleisti updeitinti el. pašto ir slaptazodzio!
      // Jei norėtum užrakinti dar kitus laukus, pridėk čia.

      if (fields.length === 0) {
        return res.status(400).json({ error: 'Nėra ką atnaujinti' });
      }

      values.push(email); // WHERE pagal email
      const updateRes = await query(
        `UPDATE users SET ${fields.join(', ')} WHERE email = $${idx} RETURNING *;`,
        values
      );

      // Išvalyti slaptažodį
      const updated = updateRes.rows[0];
      if (updated) delete updated.password;

      res.status(200).json(updated);
    } catch (error) {
      console.error('ATNAUJINIMO KLAIDA:', error.message);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  // Jei metodas neleistinas
  res.status(405).json({ error: 'Metodas neleidžiamas' });
}
