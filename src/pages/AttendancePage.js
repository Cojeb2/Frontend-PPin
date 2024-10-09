import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AttendancePage.css'; // CSS 파일을 가져옵니다.
import NavBar from '../components/NavBar';

const AttendanceTable = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [departmentFilter, setDepartmentFilter] = useState('all'); // 부서 필터 상태
  const [showMissingAttendance, setShowMissingAttendance] = useState(false); // 출퇴근 기록 없는 사람 필터 상태
  const [employees, setEmployees] = useState([]); // 사원 목록 상태 추가
  const [error, setError] = useState(null); // 오류 상태 추가

  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || '';

    // 사원 목록 API 호출
    axios.get(`${apiUrl}/employee/all`)
      .then(response => {
        // 응답 데이터가 배열인지 확인
        if (Array.isArray(response.data)) {
          setEmployees(response.data); // 응답 데이터로 사원 목록 설정
        } else {
          console.error('직원 데이터는 배열이 아닙니다:', response.data);
          setEmployees([]); // 빈 배열로 설정하여 이후 필터링에서 에러 방지
        }
      })
      .catch(error => {
        console.error('사원 데이터를 가져오는 중 오류가 발생했습니다!', error);
        setError('사원 데이터를 가져오는 중 오류가 발생했습니다.'); // 오류 메시지 설정
      });
  }, []); // 컴포넌트가 마운트될 때 API 호출

  const handlePreviousMonth = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() - 1);
      return newDate; // 새로운 날짜 반환
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1);
      return newDate; // 새로운 날짜 반환
    });
  };

  const handleDepartmentFilterChange = (e) => {
    setDepartmentFilter(e.target.value);
  };

  const handleMissingAttendanceChange = () => {
    setShowMissingAttendance((prev) => !prev);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(); // 해당 월의 일 수
  const today = new Date(); // 현재 날짜

  // 요일 배열 생성
  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

  // 필터링 로직
  const filteredEmployees = employees.filter((employee) => {
    // 부서 필터링
    if (departmentFilter !== 'all' && employee.department !== departmentFilter) {
      return false;
    }
    // 출퇴근 기록 없는 사람 필터링
    if (showMissingAttendance) {
      return Object.values(employee.attendance).some(
        ({ clockIn, clockOut }) => clockIn === '-' || clockOut === '-'
      );
    }
    return true;
  });

  return (
    <div className="attendance-table-container">
      <h2 className="attendance-table-title">전직원 출퇴근 기록</h2>
      <NavBar />
      
      {error && <p className="error-message">{error}</p>} {/* 오류 메시지 표시 */}

      <div className="attendance-table-navigation">
        <button onClick={handlePreviousMonth}>이전</button>
        <span>{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</span>
        <button onClick={handleNextMonth}>다음</button>
      </div>

      <div className="attendance-table-filters">
        <label htmlFor="departmentFilter">부서 필터:</label>
        <select id="departmentFilter" value={departmentFilter} onChange={handleDepartmentFilterChange}>
          <option value="all">전체</option>
          <option value="영업팀">영업팀</option>
          <option value="인사관리팀">인사관리팀</option>
          <option value="인사기획팀">인사기획팀</option>
        </select>

        <label htmlFor="missingAttendance">
          <input
            type="checkbox"
            id="missingAttendance"
            checked={showMissingAttendance}
            onChange={handleMissingAttendanceChange}
          />
          공란 체크
        </label>
      </div>

      <table className="attendance-table">
        <thead>
          <tr className="attendance-table-header">
            <th className="attendance-table-header-cell">직원</th>
            {[...Array(daysInMonth)].map((_, index) => {
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), index + 1);
              const dayOfWeek = daysOfWeek[date.getDay()]; // 요일 가져오기
              const isToday = date.toDateString() === today.toDateString(); // 오늘 날짜인지 체크
              return (
                <th
                  key={index}
                  className={`attendance-table-header-cell ${isToday ? 'today-cell' : ''} ${date.getDay() === 0 ? 'sunday' : date.getDay() === 6 ? 'saturday' : ''}`}
                >
                  {index + 1}<br />({dayOfWeek})
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((employee, index) => (
              <tr key={index} className="attendance-table-row">
                <td className="attendance-table-cell">{employee.name}</td>
                {[...Array(daysInMonth)].map((_, dayIndex) => {
                  const { clockIn, clockOut } = employee.attendance[dayIndex + 1] || {};
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayIndex + 1);
                  const isPastDate = date < new Date(); // 현재 날짜 이전인지 체크
                  const isToday = date.toDateString() === today.toDateString(); // 오늘 날짜인지 체크
                  return (
                    <td key={dayIndex} className={`attendance-table-cell ${isToday ? 'today-cell' : ''}`}>
                      <div className={isPastDate && clockIn === '-' ? 'attendance-missing' : ''}>
                        {clockIn === '' ? '' : clockIn === '-' ? '-' : clockIn}
                      </div>
                      <div className={isPastDate && clockOut === '-' ? 'attendance-missing' : ''}>
                        {clockOut === '' ? '' : clockOut === '-' ? '-' : clockOut}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={daysInMonth + 1} className="attendance-table-cell">출퇴근 기록이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;