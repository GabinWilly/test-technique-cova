package com.cova.taskmanager.repository;

import java.util.List;
import java.util.Optional;

import com.cova.taskmanager.domain.Task;
import com.cova.taskmanager.domain.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, Long> {

    /**
     * Liste les taches d'un utilisateur, avec filtres optionnels.
     *
     * <p>Les deux filtres sont neutralises quand le parametre est {@code null},
     * ce qui evite d'ecrire quatre methodes de requete pour les combinaisons
     * possibles de statut et de recherche.
     */
    @Query("""
            SELECT t FROM Task t
            WHERE t.owner.id = :ownerId
              AND (:status IS NULL OR t.status = :status)
              AND (:search IS NULL
                   OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY t.updatedAt DESC
            """)
    List<Task> search(
            @Param("ownerId") Long ownerId,
            @Param("status") TaskStatus status,
            @Param("search") String search);

    Optional<Task> findByIdAndOwnerId(Long id, Long ownerId);
}
