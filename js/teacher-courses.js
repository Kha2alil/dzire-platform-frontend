/* teacher-courses.js */
let allCourses = [];
let selectedThumbnailFile = null;

async function fetchCourses() {
  try {
    const data = await apiCall('GET', '/courses');
    if (data && data.success) {
      allCourses = data.data.courses || [];
      console.log('🔍 Fetched courses:', allCourses);
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

  const BASE_URL = 'http://localhost:3000';

  el.innerHTML = data.map(c => {
    const levelClass = c.difficulty_level === 'Beginner' ? 'badge-green' : c.difficulty_level === 'Intermediate' ? 'badge-blue' : 'badge-purple';
    const progress = c.progress || 0;
    const hasThumb = c.thumbnail_url && c.thumbnail_url.trim() !== '';
    let imgUrl = '';
    if (hasThumb) {
      imgUrl = c.thumbnail_url.startsWith('/') ? BASE_URL + c.thumbnail_url : c.thumbnail_url;
    }

    let thumbnailHtml = '';
    if (hasThumb) {
      thumbnailHtml = `
        <div class="course-card-top" style="height: 140px; background: #0F1B35; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.parentElement.innerHTML = '<div style=\'display:flex; align-items:center; justify-content:center; width:100%; height:100%; background:${getCourseColor(c.difficulty_level)}; font-size:32px;\'>${getCourseEmoji(c.title)}</div>';" />
        </div>
      `;
    } else {
      thumbnailHtml = `
        <div class="course-card-top" style="height: 140px; display: flex; align-items: center; justify-content: center; background: ${getCourseColor(c.difficulty_level)}; font-size: 32px;">
          ${getCourseEmoji(c.title)}
        </div>
      `;
    }

    return `
      <div class="course-card" onclick="openCourseBuilder('${c.id}')">
        ${thumbnailHtml}
        <div class="course-card-body">
          <div class="course-card-title">${escapeHtml(c.title)}</div>
          <div class="course-card-meta">
            <span>👥 ${c.students_count || 0}</span>
            <span>📹 ${c.lessons_count || 0} lessons</span>
            <span>⭐ ${c.rating || 4.5}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${progress}%"></div>
          </div>
          <div class="course-card-footer">
            <div class="badge ${levelClass}">${c.difficulty_level || 'Intermediate'}</div>
            <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); toggleCoursePublish('${c.id}', ${c.is_published})">${c.is_published ? '📘 Unpublish' : '📗 Publish'}</button>
            <button class="btn btn-primary btn-xs" onclick="event.stopPropagation(); openCourseBuilder('${c.id}')">✎ Edit</button>
            <button class="btn btn-danger btn-xs" onclick="event.stopPropagation(); confirmDeleteCourse('${c.id}', '${escapeHtml(c.title)}')">🗑️ Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function deleteCourse(courseId) {
  try {
    const data = await apiCall('DELETE', `/courses/${courseId}`);
    if (data && data.success) {
      showToast('Course deleted successfully!', 'success');
      await fetchCourses();
    } else {
      showToast(data?.message || 'Failed to delete course', 'error');
    }
  } catch (err) {
    console.error('Delete course error:', err);
    showToast('Server error', 'error');
  }
}

function confirmDeleteCourse(courseId, courseTitle) {
  if (confirm(`Are you sure you want to delete the course "${courseTitle}"? This action cannot be undone.`)) {
    deleteCourse(courseId);
  }
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
  const thumbnailFile = selectedThumbnailFile;

  if (!title || !description || !subdomainId || !difficultyLevel) {
    showToast('Please fill all fields', 'error');
    return;
  }

  const createBtn = document.getElementById('createCourseBtn');
  const originalText = createBtn.innerHTML;
  createBtn.disabled = true;
  createBtn.innerHTML = 'Creating... ⏳';

  try {
    // Step 1: Create the course
    const courseRes = await apiCall('POST', '/courses', {
      title,
      description,
      subdomain_id: subdomainId,
      difficulty_level: difficultyLevel
    });

    console.log('Course creation response:', courseRes);

    if (!courseRes || !courseRes.success) {
      throw new Error(courseRes?.message || 'Failed to create course');
    }

    // Try to get ID from response
    let newCourseId = null;
    if (courseRes.data?.course?.id) newCourseId = courseRes.data.course.id;
    else if (courseRes.data?.id) newCourseId = courseRes.data.id;
    else if (courseRes.course?.id) newCourseId = courseRes.course.id;
    else if (courseRes.id) newCourseId = courseRes.id;

    // If still null, fetch all courses and find the newest one (by created_at)
    if (!newCourseId) {
      console.log('Response missing ID, fetching courses to find the newest...');
      // Wait a short moment for the database to commit
      await new Promise(resolve => setTimeout(resolve, 500));
      const coursesRes = await apiCall('GET', '/courses');
      if (coursesRes && coursesRes.success) {
        const courses = coursesRes.data.courses || [];
        // Sort by created_at descending, take the first
        const sorted = [...courses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const newest = sorted[0];
        if (newest && newest.title === title) {
          newCourseId = newest.id;
          console.log('Found newest course with matching title:', newCourseId);
        } else if (newest) {
          // If title doesn't match, maybe the newest is still correct? Use it.
          newCourseId = newest.id;
          console.log('Using newest course ID:', newCourseId);
        }
      }
    }

    if (!newCourseId) {
      throw new Error('Could not extract course ID from response or courses list');
    }

    console.log('Extracted Course ID:', newCourseId);

    // Step 2: Upload thumbnail if a file was selected
    if (thumbnailFile) {
      const formData = new FormData();
      formData.append('thumbnail', thumbnailFile);

      console.log(`Uploading thumbnail to: /courses/${newCourseId}/thumbnail`);
      const uploadRes = await apiUpload(`/courses/${newCourseId}/thumbnail`, formData);
      console.log('Thumbnail upload response:', uploadRes);

      if (uploadRes && uploadRes.success) {
        showToast('Thumbnail uploaded successfully', 'success');
      } else {
        console.error('Upload failed:', uploadRes);
        showToast('Course created but thumbnail upload failed: ' + (uploadRes?.message || 'Unknown error'), 'warning');
      }
    } else {
      console.log('No thumbnail selected');
    }

    closeModal('newCourse');
    showToast('Course created successfully! 🎉', 'success');
    await fetchCourses();

    // Clear form fields
    document.getElementById('newCourseTitle').value = '';
    document.getElementById('newCourseDescription').value = '';
    document.getElementById('newCourseSubdomain').value = '';
    document.getElementById('newCourseDifficulty').value = 'Beginner';
    document.getElementById('newCourseThumbnail').value = '';
    const previewDiv = document.getElementById('thumbnailPreview');
    if (previewDiv) previewDiv.style.display = 'none';
    const previewImg = document.getElementById('thumbnailPreviewImg');
    if (previewImg) previewImg.src = '';
    selectedThumbnailFile = null;

  } catch (error) {
    console.error('Create course error:', error);
    showToast(error.message || 'Server error', 'error');
  } finally {
    createBtn.disabled = false;
    createBtn.innerHTML = originalText;
  }
}

// Preview thumbnail when file is selected
const thumbnailInput = document.getElementById('newCourseThumbnail');
if (thumbnailInput) {
  thumbnailInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    selectedThumbnailFile = file; // Store globally
    const previewDiv = document.getElementById('thumbnailPreview');
    const previewImg = document.getElementById('thumbnailPreviewImg');
    if (file && (file.type.startsWith('image/'))) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        previewImg.src = ev.target.result;
        previewDiv.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      previewDiv.style.display = 'none';
      previewImg.src = '';
    }
  });
}

async function initCourses() {
  await fetchSubdomains();
  await fetchCourses();
  renderNotifications();
}
initCourses();