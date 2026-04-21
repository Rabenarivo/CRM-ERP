package com.example.CRMERP.repository;

import com.example.CRMERP.entity.WorkflowLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;


public interface WorkflowLogRepository extends JpaRepository<WorkflowLog, Long> {
	List<WorkflowLog> findAllByOrderByDateActionDesc();
}
