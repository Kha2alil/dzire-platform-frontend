/* teacher-courses.js */
let allCourses = [];

async function fetchCourses() {
  try {
    const data = await apiCall('GET', '/courses');
    if (data && data.success) {
      allCourses = data.data.courses || [];
      renderCourseCards(allCourses);
      return allCourses;
    } else return [];
  } catch (err) { return []; }
}

function renderCourseCards(data) {
  const el = document.getElementById('courseGrid');
  if (!el) return;
  if (!data.length) {
    el.innerHTML = '<div class="empty-state" style="grid-column:1/-1">No courses found</div>';
    return;
  }
  el.innerHTML = data.map(c => {
    const emoji = getCourseEmoji(c.title);
    const levelClass = c.difficulty_level === 'Beginner' ? 'badge-green' : c.difficulty_level === 'Intermediate' ? 'badge-blue' : 'badge-purple';
    const publishClass = c.is_published ? 'badge-green' : 'badge-blue';
    const progress = c.progress || 0;
    return `
      <div class="course-card" onclick="openCourseBuilder('${c.id}')">
        <div class="course-card-top" style="background:${getCourseColor(c.difficulty_level)}">${emoji}</div>
        <div class="course-card-body">
          <div class="course-card-title">${escapeHtml(c.title)}</div>
          <div class="course-card-meta"><span>👥 ${c.students_count || 0}</span><span>📹 ${c.lessons_count || 0} lessons</span><span>⭐ ${c.rating || 4.5}</span></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
          <div class="course-card-footer">
            <div class="badge ${levelClass}">${c.difficulty_level || 'Intermediate'}</div>
            <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); toggleCoursePublish('${c.id}', ${c.is_published})">${c.is_published ? '📘 Unpublish' : '📗 Publish'}</button>
            <button class="btn btn-primary btn-xs" onclick="openCourseBuilder('${c.id}')">✎ Edit</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getCourseEmoji(title) {
  const t = title.toLowerCase();
  if (t.includes('react')) return '⚛️';
  if (t.includes('node')) return '🗄️';
  if (t.includes('css')) return '🎨';
  if (t.includes('security')) return '🔒';
  if (t.includes('full-stack')) return '🌐';
  return '📚';
}

function getCourseColor(level) {
  if (level === 'Beginner') return 'rgba(16,185,129,0.15)';
  if (level === 'Advanced') return 'rgba(239,68,68,0.15)';
  return 'rgba(59,130,246,0.15)';
}

function filterCourses() {
  const search = document.getElementById('courseSearch')?.value?.toLowerCase() || '';
  const status = document.getElementById('courseFilter')?.value || '';
  const diff = document.getElementById('diffFilter')?.value || '';
  const filtered = allCourses.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search);
    const matchStatus = !status || (status === 'Active' && c.is_published === true) || (status === 'Pending' && c.is_published === false);
    const matchDiff = !diff || c.difficulty_level === diff;
    return matchSearch && matchStatus && matchDiff;
  });
  renderCourseCards(filtered);
}

async function toggleCoursePublish(courseId, currentStatus) {
  const newStatus = !currentStatus;
  const data = await apiCall('PATCH', `/courses/${courseId}/publish`, { is_published: newStatus });
  if (data && data.success) {
    showToast(`Course ${newStatus ? 'published' : 'unpublished'}!`, 'success');
    await fetchCourses();
  } else showToast(data?.message || 'Failed', 'error');
}

async function createCourse() {
  const title = document.getElementById('newCourseTitle')?.value?.trim();
  const description = document.getElementById('newCourseDescription')?.value?.trim();
  const subdomainId = document.getElementById('newCourseSubdomain')?.value;
  const difficultyLevel = document.getElementById('newCourseDifficulty')?.value;
  if (!title || !description || !subdomainId || !difficultyLevel) {
    showToast('Please fill all fields', 'error');
    return;
  }
  const data = await apiCall('POST', '/courses', { title, description, subdomain_id: subdomainId, difficulty_level: difficultyLevel });
  if (data && data.success) {
    closeModal('newCourse');
    showToast('Course created!', 'success');
    await fetchCourses();
    document.getElementById('newCourseTitle').value = '';
    document.getElementById('newCourseDescription').value = '';
    document.getElementById('newCourseSubdomain').value = '';
    document.getElementById('newCourseDifficulty').value = 'Beginner';
  } else showToast(data?.message || 'Failed', 'error');
}

async function initCourses() {
  await fetchSubdomains();
  await fetchCourses();
  renderNotifications();
}
initCourses();